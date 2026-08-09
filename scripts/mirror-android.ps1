$ErrorActionPreference = 'Continue'

$ADB = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$EMU = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
$AVD = 'Pixel_10a'
$SERIAL = 'emulator-5554'
$FRAME = Join-Path $env:TEMP 'guest_frame.png'

# 1. Emulator (start headless if not already running)
if (-not (Get-Process emulator -ErrorAction SilentlyContinue)) {
    "starting headless emulator..."
    Start-Process -FilePath $EMU -ArgumentList @('-avd', $AVD, '-no-window', '-gpu', 'swiftshader_indirect', '-no-audio', '-no-boot-anim', '-skin', '1920x1080')
} else {
    "emulator already running"
}

# 2. Wait for boot
$deadline = (Get-Date).AddMinutes(4)
$boot = $null
do {
    Start-Sleep -Seconds 5
    $boot = cmd /c "`"$ADB`" -s $SERIAL shell getprop sys.boot_completed 2>nul"
} while ($boot -ne '1' -and (Get-Date) -lt $deadline)
if ($boot -ne '1') { 'ERROR: boot timeout'; exit 1 }
"boot complete"

# 3. Configure guest
cmd /c "`"$ADB`" -s $SERIAL emu power ac on 2>nul" | Out-Null
cmd /c "`"$ADB`" -s $SERIAL shell svc power stayon true 2>nul" | Out-Null
cmd /c "`"$ADB`" -s $SERIAL shell settings put system screen_off_timeout 2147483647 2>nul" | Out-Null
cmd /c "`"$ADB`" -s $SERIAL shell locksettings set-disabled true 2>nul" | Out-Null
cmd /c "`"$ADB`" -s $SERIAL shell wm dismiss-keyguard 2>nul" | Out-Null
cmd /c "`"$ADB`" -s $SERIAL shell wm size 1920x1080 2>nul" | Out-Null
cmd /c "`"$ADB`" -s $SERIAL shell wm density 320 2>nul" | Out-Null
"configured"

# 4. Start mirror viewer (dedupe)
$existing = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
    Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -match 'mirror-view\.ps1' }
if (-not $existing) {
    Start-Process powershell -ArgumentList @('-ExecutionPolicy', 'Bypass', '-File',
        (Join-Path $PSScriptRoot 'mirror-view.ps1'),
        '-MonitorX', '1920', '-MonitorY', '0', '-MonitorW', '1920', '-MonitorH', '1080')
    "viewer started"
} else {
    "viewer already running"
}

# 5. Black-frame watchdog: a black guest renders as a ~10KB PNG (real frames are ~1MB+).
#    Wake it with the verified power-toggle sequence.
"watchdog active"
while ($true) {
    Start-Sleep -Seconds 5
    try {
        if (-not (Test-Path $FRAME)) { continue }
        $fi = Get-Item $FRAME
        if ($fi.Length -gt 30000) { continue }
        # only trust a stale (frozen) frame - a fresh one means ticks are alive
        if ((Get-Date) - $fi.LastWriteTime -lt (New-TimeSpan -Seconds 15)) { continue }
        "black frame detected ($($fi.Length)b, " + $fi.LastWriteTime.ToString('HH:mm:ss') + ") - waking guest"
        cmd /c "`"$ADB`" -s $SERIAL shell input keyevent 26 2>nul" | Out-Null
        Start-Sleep -Seconds 2
        cmd /c "`"$ADB`" -s $SERIAL shell input keyevent 26 2>nul" | Out-Null
        Start-Sleep -Seconds 2
        cmd /c "`"$ADB`" -s $SERIAL shell wm dismiss-keyguard 2>nul" | Out-Null
        cmd /c "`"$ADB`" -s $SERIAL shell input keyevent 4 2>nul" | Out-Null
    } catch {
        "watchdog error: $_"
    }
}