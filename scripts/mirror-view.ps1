param(
    [string]$Adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    [int]$MonitorX = 1920,
    [int]$MonitorY = 0,
    [int]$MonitorW = 1920,
    [int]$MonitorH = 1080,
    [int]$IntervalMs = 1000
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MirrorNative {
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
'@

$framePath = Join-Path $env:TEMP 'guest_frame.png'
$form = New-Object System.Windows.Forms.Form
$form.Text = 'Android Mirror'
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.Bounds = New-Object System.Drawing.Rectangle($MonitorX, $MonitorY, $MonitorW, $MonitorH)
$form.TopMost = $true
$form.ShowInTaskbar = $false
$form.BackColor = [System.Drawing.Color]::Black

$pic = New-Object System.Windows.Forms.PictureBox
$pic.Dock = [System.Windows.Forms.DockStyle]::Fill
$pic.SizeMode = [System.Windows.Forms.PictureBoxSizeMode]::StretchImage
$form.Controls.Add($pic)

$form.Add_Shown({ $script:timer.Start() })
$form.Add_KeyDown({ if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Escape) { $form.Close() } })

$busy = $false
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = $IntervalMs
$timer.Add_Tick({
    if ($busy) { return }
    $busy = $true
    try {
        $tickPath = "$framePath.tmp"
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = 'cmd.exe'
        $psi.Arguments = "/c `"`"$Adb`" -s emulator-5554 exec-out screencap -p > `"$tickPath`" 2>nul`""
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        try {
            $p = [System.Diagnostics.Process]::Start($psi)
            if (-not $p.WaitForExit(5000)) {
                try { $p.Kill() } catch {}
                $p.WaitForExit()
            }
            $p.Dispose()
        } catch {
            $tickPath = $null
        }
        if ($tickPath -and (Test-Path $tickPath) -and ((Get-Item $tickPath).Length -gt 10000)) {
            try {
                $bytes = [System.IO.File]::ReadAllBytes($tickPath)
                $ms = New-Object System.IO.MemoryStream(, $bytes)
                $new = New-Object System.Drawing.Bitmap($ms)
                $ms.Dispose()
                $old = $pic.Image
                $pic.Image = $new
                if ($old) { $old.Dispose() }
            } catch {
                if ($pic.Image) { $pic.Image.Dispose(); $pic.Image = $null }
            }
            [System.IO.File]::Copy($tickPath, $framePath, $true)
            Remove-Item $tickPath -Force -ErrorAction SilentlyContinue
        }
    } finally {
        $busy = $false
    }
})
$form.Add_FormClosed({
    $timer.Stop()
    if ($pic.Image) { $pic.Image.Dispose() }
})

[System.Windows.Forms.Application]::EnableVisualStyles()
[System.Windows.Forms.Application]::Run($form)