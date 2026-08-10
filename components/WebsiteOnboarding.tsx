"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  MapPin,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import { emptyOnboardingBrief, type OnboardingBrief } from "@/lib/onboarding";
import {
  ONBOARDING_LOCAL_DRAFT_KEY,
  type LocalOnboardingDraft,
} from "@/lib/onboarding-agent";

type AddressSuggestion = { label: string; url: string };
const steps = ["Your business", "Your goals", "Your style", "Review"];
const industries = [
  "Home services",
  "Health & wellness",
  "Dental or medical",
  "Beauty & personal care",
  "Professional services",
  "Restaurant & hospitality",
  "Fitness",
  "Retail",
  "Real estate",
  "Other",
];
const businessTypes: Record<string, string[]> = {
  "Home services": [
    "Plumber",
    "Junk removal",
    "HVAC",
    "Electrician",
    "Roofer",
    "Landscaper",
    "House cleaner",
    "Painter",
    "Pest control",
    "Garage door service",
    "General contractor",
    "Window cleaner",
    "Pressure washing",
    "Flooring contractor",
    "Moving company",
    "Locksmith",
    "Restoration company",
    "Concrete contractor",
    "Pool service",
    "Tree service",
    "Appliance repair",
    "Handyman",
    "Solar installer",
    "Septic service",
    "Fencing contractor",
  ],
  "Health & wellness": [
    "Chiropractor",
    "Therapist",
    "Massage therapist",
    "Med spa",
    "Nutritionist",
    "Physical therapist",
    "Wellness clinic",
    "Acupuncturist",
    "Mental health counselor",
    "Occupational therapist",
    "Personal wellness coach",
    "Weight-loss clinic",
  ],
  "Dental or medical": [
    "Dentist",
    "Orthodontist",
    "Primary care clinic",
    "Medical spa",
    "Urgent care",
    "Specialist clinic",
    "Pediatrician",
    "Optometrist",
    "Dermatologist",
    "Veterinary clinic",
    "Plastic surgeon",
    "Sleep clinic",
  ],
  "Beauty & personal care": [
    "Hair salon",
    "Barbershop",
    "Nail salon",
    "Esthetician",
    "Lash studio",
    "Tattoo studio",
    "Spa",
    "Makeup artist",
    "Waxing studio",
    "Hair removal clinic",
    "Bridal beauty service",
  ],
  "Professional services": [
    "Law firm",
    "Accounting firm",
    "Marketing agency",
    "Insurance agency",
    "Consultant",
    "Financial advisor",
    "IT services",
    "Staffing agency",
    "Architecture firm",
    "Engineering firm",
    "Bookkeeper",
    "Business coach",
  ],
  "Restaurant & hospitality": [
    "Restaurant",
    "Café",
    "Bar",
    "Catering company",
    "Food truck",
    "Event venue",
    "Bakery",
    "Pizzeria",
    "Brewery",
    "Hotel",
    "Coffee shop",
    "Private chef",
  ],
  Fitness: [
    "Gym",
    "Personal trainer",
    "Yoga studio",
    "Pilates studio",
    "Martial arts school",
    "Fitness coach",
    "CrossFit gym",
    "Dance studio",
    "Boxing gym",
    "Sports performance clinic",
  ],
  Retail: [
    "Local retail store",
    "Boutique",
    "Specialty shop",
    "E-commerce store",
    "Florist",
    "Jewelry store",
    "Auto dealership",
    "Pet store",
    "Furniture store",
    "Liquor store",
  ],
  "Real estate": [
    "Real estate agent",
    "Real estate team",
    "Property manager",
    "Mortgage broker",
    "Home builder",
    "Commercial real estate broker",
    "Real estate investor",
    "Home inspector",
    "Appraiser",
  ],
  Other: [
    "Other local business",
    "Nonprofit",
    "Event service",
    "Education provider",
    "Online service business",
  ],
};
const states = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];
const citiesByState: Record<string, string[]> = {
  Alabama: ["Birmingham", "Montgomery", "Huntsville"],
  Arizona: ["Phoenix", "Tucson", "Mesa"],
  California: [
    "Los Angeles",
    "San Diego",
    "San Francisco",
    "San Jose",
    "Sacramento",
  ],
  Colorado: ["Denver", "Colorado Springs", "Aurora", "Fort Collins"],
  Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
  Georgia: ["Atlanta", "Savannah", "Augusta"],
  Illinois: ["Chicago", "Aurora", "Naperville"],
  Massachusetts: ["Boston", "Worcester", "Cambridge"],
  Michigan: ["Detroit", "Grand Rapids", "Ann Arbor"],
  Nevada: ["Las Vegas", "Henderson", "Reno"],
  "New Jersey": ["Newark", "Jersey City", "Paterson"],
  "New York": ["New York City", "Buffalo", "Rochester", "Albany"],
  "North Carolina": ["Charlotte", "Raleigh", "Durham", "Greensboro"],
  Ohio: ["Columbus", "Cleveland", "Cincinnati"],
  Oregon: ["Portland", "Eugene", "Salem"],
  Pennsylvania: ["Philadelphia", "Pittsburgh", "Allentown"],
  Tennessee: ["Nashville", "Memphis", "Knoxville"],
  Texas: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
  Utah: ["Salt Lake City", "Provo", "West Valley City"],
  Virginia: ["Virginia Beach", "Richmond", "Arlington"],
  Washington: ["Seattle", "Spokane", "Tacoma", "Bellevue"],
  Wisconsin: ["Milwaukee", "Madison", "Green Bay"],
};
const serviceOptions: Record<string, string[]> = {
  Plumber: [
    "Drain cleaning",
    "Water heater repair",
    "Water heater installation",
    "Leak repair",
    "Emergency plumbing",
    "Sewer line service",
    "Fixture installation",
  ],
  "Junk removal": [
    "Household junk removal",
    "Furniture removal",
    "Appliance removal",
    "Construction debris",
    "Estate cleanouts",
    "Commercial cleanouts",
    "Donation pickup",
  ],
  HVAC: [
    "AC repair",
    "Heating repair",
    "System installation",
    "Maintenance plans",
    "Indoor air quality",
    "Emergency HVAC service",
  ],
  Electrician: [
    "Electrical repairs",
    "Panel upgrades",
    "Lighting installation",
    "EV charger installation",
    "Emergency electrical service",
    "Commercial electrical work",
  ],
  Roofer: [
    "Roof repair",
    "Roof replacement",
    "Roof inspection",
    "Storm damage",
    "Gutter service",
    "Commercial roofing",
  ],
  Landscaper: [
    "Landscape design",
    "Lawn maintenance",
    "Irrigation",
    "Hardscaping",
    "Seasonal cleanup",
    "Tree and shrub care",
  ],
  "House cleaner": [
    "Recurring cleaning",
    "Deep cleaning",
    "Move-in / move-out cleaning",
    "Commercial cleaning",
    "Post-construction cleaning",
  ],
  "Window cleaner": [
    "Exterior window cleaning",
    "Interior window cleaning",
    "Screen cleaning",
    "Gutter cleaning",
    "Commercial window cleaning",
  ],
  "Pressure washing": [
    "House washing",
    "Driveway cleaning",
    "Deck and patio cleaning",
    "Roof cleaning",
    "Commercial washing",
  ],
  "Flooring contractor": [
    "Floor installation",
    "Floor refinishing",
    "Hardwood flooring",
    "Tile installation",
    "Carpet installation",
  ],
  "Moving company": [
    "Local moves",
    "Long-distance moves",
    "Packing services",
    "Commercial moves",
    "Storage",
  ],
  "Restoration company": [
    "Water damage restoration",
    "Fire damage restoration",
    "Mold remediation",
    "Emergency response",
    "Reconstruction",
  ],
  "Tree service": [
    "Tree trimming",
    "Tree removal",
    "Stump grinding",
    "Emergency tree service",
    "Lot clearing",
  ],
  Restaurant: [
    "Reservations",
    "Lunch service",
    "Dinner service",
    "Private dining",
    "Catering",
    "Takeout and delivery",
  ],
  Café: [
    "Coffee and espresso",
    "Breakfast",
    "Pastries",
    "Lunch",
    "Online ordering",
    "Catering",
  ],
  "Catering company": [
    "Wedding catering",
    "Corporate catering",
    "Private events",
    "Drop-off catering",
    "Custom menus",
  ],
  "Real estate agent": [
    "Buyer consultations",
    "Home valuations",
    "Property listings",
    "Home tours",
    "Relocation support",
  ],
  "Law firm": [
    "Case consultations",
    "Legal representation",
    "Document review",
    "Practice-area services",
    "Virtual consultations",
  ],
  Dentist: [
    "New patient visits",
    "Routine cleanings",
    "Emergency appointments",
    "Cosmetic dentistry",
    "Restorative dentistry",
    "Orthodontic consultations",
  ],
  "Veterinary clinic": [
    "Wellness exams",
    "Vaccinations",
    "Sick visits",
    "Dental care",
    "Surgery",
    "Emergency care",
  ],
  "Hair salon": [
    "Haircuts",
    "Hair color",
    "Styling",
    "Extensions",
    "Bridal hair",
    "Treatments",
  ],
  Barbershop: [
    "Haircuts",
    "Beard trims",
    "Hot towel shaves",
    "Kids cuts",
    "Styling",
  ],
  "Marketing agency": [
    "Marketing strategy",
    "Google Ads",
    "SEO",
    "Social media",
    "Website projects",
    "Lead generation",
  ],
  Gym: [
    "Memberships",
    "Group fitness",
    "Personal training",
    "Free trials",
    "Fitness assessments",
  ],
  "Home services": [
    "Emergency repairs",
    "Installation",
    "Maintenance",
    "Inspections",
    "Estimates",
    "Residential service",
    "Commercial service",
  ],
  "Health & wellness": [
    "New client appointments",
    "Consultations",
    "Ongoing treatment",
    "Wellness plans",
    "Virtual sessions",
    "In-person visits",
  ],
  "Dental or medical": [
    "New patient visits",
    "Routine care",
    "Emergency appointments",
    "Specialist treatment",
    "Cosmetic services",
    "Insurance consultations",
  ],
  "Beauty & personal care": [
    "Consultations",
    "Signature services",
    "Packages",
    "Memberships",
    "Special events",
    "Retail products",
  ],
  "Professional services": [
    "Consultations",
    "Strategy sessions",
    "Project work",
    "Retainers",
    "Assessments",
    "Business services",
  ],
  "Restaurant & hospitality": [
    "Reservations",
    "Private events",
    "Catering",
    "Takeout",
    "Group dining",
    "Gift cards",
  ],
  Fitness: [
    "Intro sessions",
    "Personal training",
    "Group classes",
    "Memberships",
    "Online coaching",
    "Wellness programs",
  ],
  Retail: [
    "In-store shopping",
    "Online ordering",
    "Custom orders",
    "Appointments",
    "Product collections",
    "Gift cards",
  ],
  "Real estate": [
    "Buyer consultations",
    "Seller valuations",
    "Property listings",
    "Home tours",
    "Investment guidance",
    "Relocation support",
  ],
  Other: [
    "Consultations",
    "Appointments",
    "Estimates",
    "Core service",
    "Packages",
    "Custom solutions",
  ],
};
const optionList = (items: string) => items.split("|");
const businessTypeServiceOptions: Record<string, string[]> = {
  Painter: optionList(
    "Interior painting|Exterior painting|Cabinet painting|Color consultations|Commercial painting",
  ),
  "Pest control": optionList(
    "General pest control|Termite treatment|Rodent control|Mosquito control|Commercial pest control",
  ),
  "Garage door service": optionList(
    "Garage door repair|Spring replacement|Opener repair|New door installation|Emergency service",
  ),
  "General contractor": optionList(
    "Home remodeling|Kitchen remodeling|Bathroom remodeling|Additions|Commercial build-outs",
  ),
  Locksmith: optionList(
    "Lockout service|Lock rekeying|Lock installation|Car key replacement|Commercial security",
  ),
  "Concrete contractor": optionList(
    "Driveways|Patios|Foundations|Concrete repair|Decorative concrete",
  ),
  "Pool service": optionList(
    "Weekly pool cleaning|Pool repair|Equipment installation|Pool opening and closing|Water testing",
  ),
  "Appliance repair": optionList(
    "Refrigerator repair|Washer and dryer repair|Dishwasher repair|Oven repair|Same-day repair",
  ),
  Handyman: optionList(
    "Home repairs|Furniture assembly|Drywall repair|Fixture installation|Maintenance visits",
  ),
  "Solar installer": optionList(
    "Solar consultations|Solar panel installation|Battery storage|Solar repairs|Energy assessments",
  ),
  "Septic service": optionList(
    "Septic pumping|Septic inspections|Septic repair|Drain field service|Emergency service",
  ),
  "Fencing contractor": optionList(
    "Fence installation|Fence repair|Wood fences|Vinyl fences|Commercial fencing",
  ),
  Chiropractor: optionList(
    "New patient exams|Chiropractic adjustments|Massage therapy|Injury care|Wellness plans",
  ),
  Therapist: optionList(
    "Individual therapy|Couples therapy|Family therapy|Virtual sessions|Initial consultations",
  ),
  "Massage therapist": optionList(
    "Swedish massage|Deep tissue massage|Sports massage|Prenatal massage|Couples massage",
  ),
  "Med spa": optionList(
    "Botox and fillers|Facials|Laser treatments|Body contouring|Skin consultations",
  ),
  Nutritionist: optionList(
    "Nutrition consultations|Meal planning|Weight management|Wellness coaching|Virtual appointments",
  ),
  "Physical therapist": optionList(
    "Injury evaluations|Post-surgery rehab|Sports therapy|Manual therapy|Telehealth",
  ),
  "Wellness clinic": optionList(
    "Wellness consultations|IV therapy|Hormone support|Weight management|Membership plans",
  ),
  Acupuncturist: optionList(
    "Acupuncture sessions|Pain management|Stress relief|Fertility support|Initial consultations",
  ),
  "Mental health counselor": optionList(
    "Individual counseling|Couples counseling|Family counseling|Virtual therapy|Initial sessions",
  ),
  "Occupational therapist": optionList(
    "Functional evaluations|Hand therapy|Pediatric therapy|Home assessments|Rehabilitation",
  ),
  "Personal wellness coach": optionList(
    "Discovery calls|One-on-one coaching|Habit coaching|Wellness plans|Virtual coaching",
  ),
  "Weight-loss clinic": optionList(
    "Weight-loss consultations|Medical weight loss|Nutrition plans|Progress check-ins|Memberships",
  ),
  Orthodontist: optionList(
    "Braces consultations|Invisalign consultations|Retainers|Adult orthodontics|New patient exams",
  ),
  "Primary care clinic": optionList(
    "Annual physicals|Sick visits|Chronic care|Preventive care|Telehealth visits",
  ),
  "Medical spa": optionList(
    "Injectables|Skin rejuvenation|Laser treatments|Body treatments|Consultations",
  ),
  "Urgent care": optionList(
    "Walk-in care|Illness treatment|Injury care|Lab testing|Sports physicals",
  ),
  "Specialist clinic": optionList(
    "New patient consultations|Specialist evaluations|Follow-up care|Procedures|Telehealth",
  ),
  Pediatrician: optionList(
    "Well-child visits|Sick visits|Vaccinations|Newborn care|Sports physicals",
  ),
  Optometrist: optionList(
    "Eye exams|Contact lens exams|Glasses|Pediatric eye care|Emergency eye care",
  ),
  Dermatologist: optionList(
    "Skin checks|Acne treatment|Eczema treatment|Cosmetic dermatology|Mole removal",
  ),
  "Plastic surgeon": optionList(
    "Cosmetic consultations|Facial procedures|Body procedures|Breast procedures|Post-op care",
  ),
  "Sleep clinic": optionList(
    "Sleep consultations|Sleep studies|CPAP support|Insomnia treatment|Follow-up care",
  ),
  "Nail salon": optionList(
    "Manicures|Pedicures|Gel nails|Nail art|Group bookings",
  ),
  Esthetician: optionList(
    "Custom facials|Chemical peels|Skin consultations|Waxing|Memberships",
  ),
  "Lash studio": optionList(
    "Lash extensions|Lash lifts|Fills|Brow services|New client consultations",
  ),
  "Tattoo studio": optionList(
    "Custom tattoos|Flash tattoos|Consultations|Cover-ups|Piercings",
  ),
  Spa: optionList(
    "Massage|Facials|Body treatments|Couples packages|Spa memberships",
  ),
  "Makeup artist": optionList(
    "Bridal makeup|Event makeup|Makeup trials|Lessons|On-location services",
  ),
  "Waxing studio": optionList(
    "Body waxing|Facial waxing|Brow shaping|Memberships|First-time appointments",
  ),
  "Hair removal clinic": optionList(
    "Laser hair removal|Electrolysis|Consultations|Package plans|Follow-up sessions",
  ),
  "Bridal beauty service": optionList(
    "Bridal hair|Bridal makeup|Trials|Bridal party services|On-location beauty",
  ),
  "Accounting firm": optionList(
    "Tax preparation|Bookkeeping|Business accounting|Payroll|Tax planning",
  ),
  "Insurance agency": optionList(
    "Auto insurance|Home insurance|Life insurance|Business insurance|Policy reviews",
  ),
  Consultant: optionList(
    "Discovery calls|Strategy sessions|Advisory services|Workshops|Retainer support",
  ),
  "Financial advisor": optionList(
    "Financial planning|Retirement planning|Investment management|Estate planning|Discovery calls",
  ),
  "IT services": optionList(
    "Managed IT|Cybersecurity|Cloud services|IT support|Technology consulting",
  ),
  "Staffing agency": optionList(
    "Temporary staffing|Permanent placement|Executive search|Employer consultations|Candidate services",
  ),
  "Architecture firm": optionList(
    "Residential design|Commercial design|Renovation planning|Permitting|Design consultations",
  ),
  "Engineering firm": optionList(
    "Engineering consultations|Site planning|Structural design|Project management|Inspections",
  ),
  Bookkeeper: optionList(
    "Monthly bookkeeping|Cleanup bookkeeping|Payroll support|Financial reports|Consultations",
  ),
  "Business coach": optionList(
    "Discovery calls|One-on-one coaching|Leadership coaching|Team workshops|Strategy planning",
  ),
  Bar: optionList(
    "Cocktails|Happy hour|Live events|Private parties|Table reservations",
  ),
  "Food truck": optionList(
    "Event catering|Private events|Corporate lunches|Pre-order pickup|Festival bookings",
  ),
  "Event venue": optionList(
    "Weddings|Corporate events|Private parties|Venue tours|Event packages",
  ),
  Bakery: optionList(
    "Custom cakes|Pastries|Wedding cakes|Catering|Online ordering",
  ),
  Pizzeria: optionList("Dine-in|Takeout|Delivery|Catering|Private events"),
  Brewery: optionList(
    "Taproom visits|Private events|Brewery tours|Food events|Merchandise",
  ),
  Hotel: optionList(
    "Room bookings|Group stays|Event spaces|Wedding blocks|Special offers",
  ),
  "Coffee shop": optionList(
    "Coffee and espresso|Breakfast|Pastries|Online ordering|Catering",
  ),
  "Private chef": optionList(
    "Private dinners|Weekly meal prep|Dinner parties|Cooking classes|Custom menus",
  ),
  "Personal trainer": optionList(
    "Personal training|Fitness assessments|Small-group training|Online coaching|Intro sessions",
  ),
  "Yoga studio": optionList(
    "Drop-in classes|Class packs|Memberships|Private yoga|Workshops",
  ),
  "Pilates studio": optionList(
    "Reformer classes|Mat classes|Private sessions|Class packs|Intro offers",
  ),
  "Martial arts school": optionList(
    "Kids classes|Adult classes|Private lessons|Trial classes|Summer camps",
  ),
  "Fitness coach": optionList(
    "Fitness coaching|Nutrition coaching|Online programs|Accountability coaching|Discovery calls",
  ),
  "CrossFit gym": optionList(
    "Drop-in classes|On-ramp programs|Memberships|Personal training|Nutrition coaching",
  ),
  "Dance studio": optionList(
    "Kids classes|Adult classes|Private lessons|Wedding dance lessons|Camps",
  ),
  "Boxing gym": optionList(
    "Boxing classes|Personal training|Beginner sessions|Sparring|Memberships",
  ),
  "Sports performance clinic": optionList(
    "Performance assessments|Speed training|Strength training|Recovery sessions|Team training",
  ),
  Florist: optionList(
    "Flower delivery|Wedding florals|Event florals|Custom arrangements|Sympathy flowers",
  ),
  "Jewelry store": optionList(
    "Custom jewelry|Engagement rings|Repairs|Appraisals|Appointments",
  ),
  "Auto dealership": optionList(
    "New vehicles|Used vehicles|Trade-in appraisals|Test drives|Financing",
  ),
  "Pet store": optionList(
    "Pet supplies|Grooming|Pet food|Delivery|Loyalty program",
  ),
  "Furniture store": optionList(
    "Furniture collections|Design consultations|Delivery|Custom orders|Financing",
  ),
  "Liquor store": optionList(
    "In-store shopping|Curbside pickup|Delivery|Special orders|Event supplies",
  ),
  "Real estate team": optionList(
    "Buyer consultations|Seller valuations|Property listings|Home tours|Relocation support",
  ),
  "Property manager": optionList(
    "Rental listings|Tenant screening|Property management|Owner consultations|Maintenance requests",
  ),
  "Mortgage broker": optionList(
    "Mortgage consultations|Pre-approval|Refinancing|Homebuyer education|Loan options",
  ),
  "Home builder": optionList(
    "Custom homes|Model home tours|Build consultations|Home plans|Warranty support",
  ),
  "Commercial real estate broker": optionList(
    "Property listings|Tenant representation|Investment sales|Site selection|Market analysis",
  ),
  "Real estate investor": optionList(
    "Property acquisitions|Investment consultations|Off-market opportunities|Partnerships|Seller offers",
  ),
  "Home inspector": optionList(
    "Buyer inspections|Pre-listing inspections|New construction inspections|Radon testing|Reports",
  ),
  Appraiser: optionList(
    "Home appraisals|Refinance appraisals|Estate appraisals|Commercial appraisals|Valuation consultations",
  ),
};
function servicesForBusinessType(businessType: string, industry: string) {
  return (
    serviceOptions[businessType] ||
    businessTypeServiceOptions[businessType] ||
    serviceOptions[industry] ||
    serviceOptions.Other
  );
}
const input =
  "w-full rounded-xl border border-[#d8d8d1] bg-white px-3 py-2.5 text-sm text-[#1d1d1a] outline-none transition focus:border-[#9eb900] focus:ring-2 focus:ring-[#d9ff4f]/50";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#272723]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs text-[#777770]">{hint}</span>
      )}
    </label>
  );
}
function Choice({
  active,
  onClick,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${active ? "border-[#9db800] bg-[#f5facf] ring-1 ring-[#d9ff4f]" : "border-[#deded7] bg-white hover:border-[#bdbdb4]"}`}
    >
      <span className="block text-sm font-semibold text-[#242421]">
        {title}
      </span>
      {detail && (
        <span className="mt-1 block text-xs leading-relaxed text-[#6c6c65]">
          {detail}
        </span>
      )}
    </button>
  );
}

export default function WebsiteOnboarding() {
  const [step, setStep] = useState(0),
    [businessName, setBusinessName] = useState(""),
    [industry, setIndustry] = useState(""),
    [brief, setBrief] = useState<OnboardingBrief>(emptyOnboardingBrief),
    [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle"),
    [error, setError] = useState(""),
    [hydrated, setHydrated] = useState(false),
    [assisting, setAssisting] = useState<
      "description" | "differentiators" | "preferences" | null
    >(null),
    [customService, setCustomService] = useState(""),
    [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>(
      [],
    ),
    [searchingAddress, setSearchingAddress] = useState(false);
  const creating = false;
  const set = <K extends keyof OnboardingBrief>(
    key: K,
    value: OnboardingBrief[K],
  ) => setBrief((prev) => ({ ...prev, [key]: value }));
  const toggleService = (service: string) =>
    set(
      "primaryServices",
      brief.primaryServices.includes(service)
        ? brief.primaryServices.filter((item) => item !== service)
        : [...brief.primaryServices, service],
    );
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ONBOARDING_LOCAL_DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved) as Partial<LocalOnboardingDraft>;
      setBusinessName(draft.businessName || "");
      setIndustry(draft.industry || "");
      setBrief({ ...emptyOnboardingBrief, ...(draft.brief || {}) });
      setStep(
        typeof draft.step === "number"
          ? Math.min(Math.max(draft.step, 0), steps.length - 1)
          : 0,
      );
    } catch {
      setError("Could not load the local draft.");
    } finally {
      setHydrated(true);
    }
  }, []);
  const save = useCallback(
    (ready = false) => {
      setState("saving");
      try {
        window.localStorage.setItem(
          ONBOARDING_LOCAL_DRAFT_KEY,
          JSON.stringify({
            businessName,
            industry,
            brief,
            step,
            status: ready ? "ready" : "draft",
          } satisfies LocalOnboardingDraft),
        );
        setError("");
        setState("saved");
      } catch {
        setState("error");
        setError(
          "Could not save this local draft. Check that browser storage is available.",
        );
      }
    },
    [businessName, industry, brief, step],
  );
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      save();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [hydrated, save]);

  function next() {
    setError("");
    const nextStep = Math.min(step + 1, steps.length - 1);
    setStep(nextStep);
    window.localStorage.setItem(
      ONBOARDING_LOCAL_DRAFT_KEY,
      JSON.stringify({
        businessName,
        industry,
        brief,
        step: nextStep,
        status: "draft",
      } satisfies LocalOnboardingDraft),
    );
    setState("saved");
  }
  function markReady() {
    save(true);
  }
  async function findBusiness() {
    setError("");
    setAddressSuggestions([]);
    if (
      !businessName.trim() ||
      !brief.marketState ||
      !brief.marketCity ||
      brief.marketCity === "Other"
    )
      return setError(
        "Add your business name, state, and city before searching.",
      );
    setSearchingAddress(true);
    try {
      const res = await fetch("/api/onboarding/address-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          city: brief.marketCity,
          state: brief.marketState,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || "Could not find business suggestions");
      setAddressSuggestions(data.suggestions || []);
      if (!data.suggestions?.length)
        setError("No matches found. You can still add your address manually.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not find business suggestions",
      );
    } finally {
      setSearchingAddress(false);
    }
  }
  async function assist(
    field: "description" | "differentiators" | "preferences",
  ) {
    setError("");
    setAssisting(field);
    try {
      const res = await fetch("/api/onboarding/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          businessName,
          industry,
          services: brief.primaryServices,
          goal: brief.primaryGoal,
          audience: brief.idealCustomers,
          tone: brief.brandTone,
          currentValue:
            field === "description"
              ? brief.businessDescription
              : field === "differentiators"
                ? brief.differentiators
                : brief.copyNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI assistance failed");
      set(
        field === "description"
          ? "businessDescription"
          : field === "differentiators"
            ? "differentiators"
            : "copyNotes",
        data.suggestion,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI assistance failed");
    } finally {
      setAssisting(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] py-8 sm:py-12">
      <div className="mx-auto w-[min(100%-32px,920px)]">
        <div className="mb-9 flex items-center justify-between">
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5d5d57]"
          >
            <ArrowLeft size={16} /> Builder
          </Link>
          <span className="inline-flex items-center gap-2 text-xs text-[#696962]">
            {state === "saving" ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {state === "saving"
              ? "Saving"
              : state === "saved"
                ? "Saved"
                : "Draft"}
          </span>
        </div>
        <div className="mb-8">
          <p className="growth-kicker">
            <span /> AI Website Builder
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-.075em] text-[#121210] sm:text-7xl">
            Tell us what matters.{" "}
            <em className="font-normal text-[#74746d]">
              We&apos;ll handle the rest.
            </em>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5c5c56]">
            A few choices about your business, goals, and taste give our website
            team the direction it needs—without making you think through the
            technical details.
          </p>
        </div>
        <ol className="mb-8 grid grid-cols-4 gap-2">
          {steps.map((name, i) => (
            <li
              key={name}
              className={`border-t pt-2 text-xs ${i === step ? "border-[#91ab00] text-[#20201d]" : i < step ? "border-[#c8df55] text-[#5f6e15]" : "border-[#d9d9d2] text-[#85857e]"}`}
            >
              {i + 1}. {name}
            </li>
          ))}
        </ol>
        <section className="rounded-3xl border border-[#deded7] bg-white p-5 shadow-[0_20px_60px_rgba(20,20,17,.06)] sm:p-9">
          <div className="mb-7 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-.05em] text-[#171715]">
                {steps[step]}
              </h2>
              <p className="mt-1 text-sm text-[#696961]">
                {step === 3
                  ? "Confirm this is the direction you want us to use."
                  : "Choose what feels most true to your business."}
              </p>
            </div>
            <span className="rounded-full bg-[#eef8b9] px-3 py-1 text-xs font-medium text-[#586900]">
              Local draft
            </span>
          </div>
          {step === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Business name">
                <input
                  className={input}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Plumbing"
                />
              </Field>
              <Field label="Industry">
                <select
                  className={input}
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    set("businessType", "");
                    set("primaryServices", []);
                  }}
                >
                  <option value="">Choose an industry</option>
                  {industries.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Business type">
                <select
                  className={input}
                  value={brief.businessType}
                  onChange={(e) => {
                    set("businessType", e.target.value);
                    set("primaryServices", []);
                  }}
                  disabled={!industry}
                >
                  <option value="">
                    {industry
                      ? "Choose a business type"
                      : "Choose an industry first"}
                  </option>
                  {(businessTypes[industry] || []).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-2">
                <p className="mb-3 text-sm font-medium text-[#272723]">
                  How do you serve customers?
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [
                      "One local area",
                      "I serve one city or a tight local area.",
                    ],
                    [
                      "Several nearby cities",
                      "I travel across a metro area or region.",
                    ],
                    ["Statewide", "I work throughout one state or province."],
                    ["Nationwide or online", "I can serve customers anywhere."],
                  ].map(([title, detail]) => (
                    <Choice
                      key={title}
                      title={title}
                      detail={detail}
                      active={brief.serviceCoverage === title}
                      onClick={() => set("serviceCoverage", title)}
                    />
                  ))}
                </div>
              </div>
              <Field label="Primary state">
                <select
                  className={input}
                  value={brief.marketState}
                  onChange={(e) => {
                    set("marketState", e.target.value);
                    set("marketCity", "");
                    set("primaryMarket", e.target.value);
                    set("locations", e.target.value ? [e.target.value] : []);
                  }}
                >
                  <option value="">Select a state</option>
                  {states.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
              </Field>
              <Field label="Primary city">
                <select
                  className={input}
                  value={brief.marketCity}
                  onChange={(e) => {
                    const city = e.target.value;
                    set("marketCity", city);
                    const market = [city, brief.marketState]
                      .filter(Boolean)
                      .join(", ");
                    set("primaryMarket", market);
                    set("locations", market ? [market] : []);
                  }}
                  disabled={!brief.marketState}
                >
                  <option value="">
                    {brief.marketState
                      ? "Select a city"
                      : "Select a state first"}
                  </option>
                  {(citiesByState[brief.marketState] || []).map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                  <option value="Other">Other / use business address</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field
                  label="Actual business address"
                  hint="Optional. Search for your business below, or enter the exact address yourself."
                >
                  <input
                    className={input}
                    value={brief.businessAddress}
                    onChange={(e) => {
                      const address = e.target.value;
                      set("businessAddress", address);
                      if (address.trim()) {
                        set("primaryMarket", address);
                        set("locations", [address]);
                      }
                    }}
                    placeholder="123 Main Street, Denver, CO 80202"
                  />
                </Field>
                <div className="mt-3 rounded-2xl border border-[#e4e4dc] bg-[#fafaf7] p-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#272723]">
                      Find my business
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#74746c]">
                      We&apos;ll search the live web using your business name
                      and selected market, then you can choose a match.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void findBusiness()}
                    disabled={
                      searchingAddress ||
                      !businessName.trim() ||
                      !brief.marketState ||
                      !brief.marketCity ||
                      brief.marketCity === "Other"
                    }
                    className="mt-3 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cfd0c7] bg-white px-3.5 py-2 text-xs font-semibold text-[#30302c] transition hover:border-[#9eb900] disabled:cursor-not-allowed disabled:opacity-45 sm:mt-0"
                  >
                    {searchingAddress ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    {searchingAddress ? "Searching…" : "Find my business"}
                  </button>
                </div>
                {addressSuggestions.length > 0 && (
                  <div className="mt-3 space-y-2" aria-live="polite">
                    <p className="text-xs font-medium text-[#5e5e57]">
                      Select the closest match, then check the address before
                      continuing.
                    </p>
                    {addressSuggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={`${suggestion.label}-${suggestion.url}`}
                        onClick={() => {
                          set("businessAddress", suggestion.label);
                          const market = [brief.marketCity, brief.marketState]
                            .filter(Boolean)
                            .join(", ");
                          set("primaryMarket", market);
                          set("locations", market ? [market] : []);
                          setAddressSuggestions([]);
                        }}
                        className="flex w-full items-start gap-3 rounded-xl border border-[#e0e0d9] bg-white px-3 py-3 text-left transition hover:border-[#a8bd29] hover:bg-[#fbfdf0]"
                      >
                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-[#809600]"
                        />
                        <span className="text-xs leading-relaxed text-[#50504b]">
                          {suggestion.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Field label="Typical travel range">
                <select
                  className={input}
                  value={brief.travelRange}
                  onChange={(e) => {
                    set("travelRange", e.target.value);
                    set("serviceAreas", e.target.value ? [e.target.value] : []);
                  }}
                >
                  <option value="">Choose a range</option>
                  <option>Within my city</option>
                  <option>Up to 15 miles</option>
                  <option>Up to 30 miles</option>
                  <option>Up to 60 miles</option>
                  <option>Across my state</option>
                  <option>Nationwide or online</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <p className="mb-3 text-sm font-medium text-[#272723]">
                  What services does {brief.businessType || "your business"}{" "}
                  offer?
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {servicesForBusinessType(brief.businessType, industry).map(
                    (service) => (
                      <Choice
                        key={service}
                        title={service}
                        active={brief.primaryServices.includes(service)}
                        onClick={() => toggleService(service)}
                      />
                    ),
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    className={input}
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder="Add another service"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const service = customService.trim();
                      if (service && !brief.primaryServices.includes(service))
                        set("primaryServices", [
                          ...brief.primaryServices,
                          service,
                        ]);
                      setCustomService("");
                    }}
                    className="shrink-0 rounded-xl border border-[#d4d4cd] px-4 text-sm font-medium text-[#3a3a35] hover:border-[#93ad00]"
                  >
                    Add
                  </button>
                </div>
                {brief.primaryServices.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brief.primaryServices.map((service) => (
                      <button
                        type="button"
                        key={service}
                        onClick={() => toggleService(service)}
                        className="rounded-full bg-[#edf7b4] px-3 py-1 text-xs font-medium text-[#536300]"
                      >
                        {service} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Field label="In a sentence or two, what should we know about your business?">
                  <textarea
                    className={`${input} min-h-28 resize-y`}
                    value={brief.businessDescription}
                    onChange={(e) => set("businessDescription", e.target.value)}
                    placeholder="What you do, who you help, and why people choose you."
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => void assist("description")}
                  disabled={assisting !== null}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-[#647800] disabled:opacity-40"
                >
                  <Sparkles size={14} />
                  {assisting === "description"
                    ? "Writing a starter…"
                    : "Help me write this"}
                </button>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-7">
              <div>
                <p className="mb-3 text-sm font-medium text-[#272723]">
                  What should the website do first?
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    [
                      "Book appointments",
                      "Make scheduling the obvious next step.",
                    ],
                    ["Get more calls", "Encourage immediate conversations."],
                    [
                      "Request estimates",
                      "Turn interest into qualified leads.",
                    ],
                  ].map(([title, detail]) => (
                    <Choice
                      key={title}
                      title={title}
                      detail={detail}
                      active={brief.primaryGoal === title}
                      onClick={() => {
                        set("primaryGoal", title);
                        set(
                          "primaryCta",
                          title === "Book appointments"
                            ? "Book an appointment"
                            : title === "Get more calls"
                              ? "Call now"
                              : "Request an estimate",
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-[#272723]">
                  Who are you trying to reach?
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "Homeowners",
                    "Businesses",
                    "Both homeowners and businesses",
                  ].map((title) => (
                    <Choice
                      key={title}
                      title={title}
                      active={brief.idealCustomers === title}
                      onClick={() => set("idealCustomers", title)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-[#272723]">
                  Anything important customers should know?
                </p>
                <textarea
                  className={`${input} min-h-24 resize-y`}
                  value={brief.differentiators}
                  onChange={(e) => set("differentiators", e.target.value)}
                  placeholder="For example: family owned, same-day availability, a warranty, years of experience."
                />
                <button
                  type="button"
                  onClick={() => void assist("differentiators")}
                  disabled={assisting !== null}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-[#647800] disabled:opacity-40"
                >
                  <Sparkles size={14} />
                  {assisting === "differentiators"
                    ? "Generating ideas…"
                    : "Suggest ideas"}
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-7">
              <div>
                <p className="mb-3 text-sm font-medium text-[#272723]">
                  How should your business feel online?
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [
                      "Confident and professional",
                      "Clear, dependable, and established.",
                    ],
                    ["Warm and approachable", "Friendly, helpful, and human."],
                    [
                      "Premium and refined",
                      "Considered, polished, and elevated.",
                    ],
                    [
                      "Direct and practical",
                      "Straightforward, fast, and no-nonsense.",
                    ],
                  ].map(([title, detail]) => (
                    <Choice
                      key={title}
                      title={title}
                      detail={detail}
                      active={brief.brandTone === title}
                      onClick={() => set("brandTone", title)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-[#272723]">
                  What visual direction feels closest?
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "Clean and minimal",
                    "Bold and energetic",
                    "Classic and trusted",
                  ].map((title) => (
                    <Choice
                      key={title}
                      title={title}
                      active={brief.visualDirection === title}
                      onClick={() => set("visualDirection", title)}
                    />
                  ))}
                </div>
              </div>
              <Field
                label="Anything you love—or want to avoid?"
                hint="Optional: describe a look, a color, a competitor, or a website you like."
              >
                <textarea
                  className={`${input} min-h-24 resize-y`}
                  value={brief.copyNotes}
                  onChange={(e) => set("copyNotes", e.target.value)}
                  placeholder="Keep it simple and local. Avoid corporate language."
                />
              </Field>
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl bg-[#f7f7f3] p-5">
                <Sparkles size={19} className="text-[#829b00]" />
                <h3 className="mt-4 text-lg font-semibold text-[#20201d]">
                  {businessName || "Your business"}
                </h3>
                <p className="mt-1 text-sm text-[#66665f]">
                  {brief.businessType || industry || "Business type not chosen"}{" "}
                  · {brief.primaryMarket || "Primary market not added"}\n
                  {brief.serviceCoverage || "Coverage not chosen"} ·{" "}
                  {brief.travelRange || "Travel range not chosen"}
                </p>
              </article>
              <article className="rounded-2xl bg-[#f7f7f3] p-5">
                <h3 className="text-sm font-semibold text-[#20201d]">
                  Website focus
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#66665f]">
                  {brief.primaryGoal || "Choose a main goal"}
                  <br />
                  For {brief.idealCustomers || "your ideal customers"}
                </p>
              </article>
              <article className="rounded-2xl bg-[#f7f7f3] p-5">
                <h3 className="text-sm font-semibold text-[#20201d]">Style</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#66665f]">
                  {brief.brandTone || "Choose a tone"}
                  <br />
                  {brief.visualDirection || "Choose a visual direction"}
                </p>
              </article>
              <article className="rounded-2xl bg-[#f7f7f3] p-5">
                <h3 className="text-sm font-semibold text-[#20201d]">
                  What happens next
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#66665f]">
                  Your brief will appear in the builder&apos;s prompt field for
                  review. Nothing starts until you choose Build.
                </p>
              </article>
            </div>
          )}
          {error && (
            <p
              className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#e4e4de] pt-5">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((v) => v - 1)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#55554f] disabled:opacity-35"
            >
              <ArrowLeft size={16} /> Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 rounded-full bg-[#151514] px-5 py-2.5 text-sm font-medium text-white"
              >
                {creating ? "Creating…" : "Continue"}
                <ArrowRight size={16} />
              </button>
            ) : (
              <Link
                href="/builder"
                onClick={markReady}
                className="inline-flex items-center gap-2 rounded-full bg-[#d9ff4f] px-5 py-2.5 text-sm font-semibold text-[#171714]"
              >
                Review in builder <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
