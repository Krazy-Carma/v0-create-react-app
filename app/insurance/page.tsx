"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Quote {
  id: string
  insurer: string
  monthlyPremium: string
  coverageType: string
  deductible: string
  notes: string
  dateObtained: string
  agentName: string
  agentPhone: string
  rating: string
}

interface InsurerEstimate {
  name: string
  phone: string
  website: string
  estimatedMonthly: number
  estimatedRange: [number, number]
  coverageType: string
  availableDiscounts: string[]
  pros: string[]
  cons: string[]
  howToGet: string
  bestFor: string
}

const DRIVER_INFO = {
  name: "Grandma",
  age: 74,
  dob: "11/03/1951",
  licenseNumber: "K01035833",
  licenseState: "Kansas",
  licenseHeldSince: "Age 16 (1967)",
  record: "Clean — no tickets or accidents",
  defensiveDriving: true,
}

const VEHICLE_INFO = {
  year: 1999,
  make: "Ford",
  model: "Econoline Van",
  vin: "1FDRE1424XHA37005",
  usage: "Local driving",
  coverageType: "Standard liability only",
}

const INSURER_ESTIMATES: InsurerEstimate[] = [
  {
    name: "Kansas Farm Bureau",
    phone: "Find local agent at kfb.org",
    website: "kfb.org",
    estimatedMonthly: 52,
    estimatedRange: [45, 60],
    coverageType: "25/50/25 Liability",
    availableDiscounts: ["Defensive driving (5-10%)", "Low mileage", "Multi-policy bundle (home+auto)", "Pay-in-full (5-8%)"],
    pros: [
      "Kansas-specific — built for KS drivers and pricing",
      "Best rates for rural/local driving profiles",
      "Local agents who know the area",
      "Often cheapest for older vehicles with liability only",
    ],
    cons: [
      "Must contact local agent (no online quotes)",
      "Only available in Kansas",
    ],
    howToGet: "Visit kfb.org to find your nearest local agent and call for a quote",
    bestFor: "Best overall value for a Kansas driver with local driving and a clean record",
  },
  {
    name: "GEICO",
    phone: "1-800-861-8380",
    website: "geico.com",
    estimatedMonthly: 58,
    estimatedRange: [50, 68],
    coverageType: "25/50/25 Liability",
    availableDiscounts: ["Defensive driving (5-10%)", "5-year good driver (up to 26%)", "Federal employee/military", "Pay-in-full"],
    pros: [
      "Get a quote online in 10 minutes — no phone call needed",
      "Strong discounts for long clean records",
      "Low overhead = lower prices",
      "Easy to manage policy online",
    ],
    cons: [
      "No local agent — support is phone/online only",
      "May not bundle as well if grandma has homeowner's insurance elsewhere",
    ],
    howToGet: "Visit geico.com or call 1-800-861-8380 for an instant quote",
    bestFor: "Best if you want a quick online quote without calling anyone",
  },
  {
    name: "State Farm",
    phone: "Find local agent at statefarm.com",
    website: "statefarm.com",
    estimatedMonthly: 63,
    estimatedRange: [55, 72],
    coverageType: "25/50/25 Liability",
    availableDiscounts: ["Defensive driving (10-15%)", "Steer Clear (mature driver)", "Multi-policy bundle (15-20%)", "Loyalty discount"],
    pros: [
      "Largest insurer in Kansas — strong local presence",
      "Best multi-policy discounts (home + auto saves 15-20%)",
      "Local agent handles everything for you",
      "Strong claims support with in-person help",
    ],
    cons: [
      "Slightly higher base rates than GEICO/Farm Bureau",
      "Best savings require bundling home insurance",
    ],
    howToGet: "Visit statefarm.com to find a local agent, or call the agent directly",
    bestFor: "Best if grandma wants a local agent and can bundle with homeowner's insurance",
  },
  {
    name: "Travelers",
    phone: "Find local agent at travelers.com",
    website: "travelers.com",
    estimatedMonthly: 67,
    estimatedRange: [58, 75],
    coverageType: "25/50/25 Liability",
    availableDiscounts: ["Defensive driving", "IntelliDrive (usage-based, up to 20%)", "Multi-policy", "Prior insurance loyalty", "Pay-in-full"],
    pros: [
      "IntelliDrive program could save up to 20% for low-mileage local driving",
      "Good mature driver discounts",
      "Strong financial stability rating",
    ],
    cons: [
      "Higher base rates than Kansas-specific insurers",
      "IntelliDrive requires a monitoring device in the van",
      "Less Kansas-specific than Farm Bureau or State Farm",
    ],
    howToGet: "Visit travelers.com to find a local independent agent",
    bestFor: "Worth trying if grandma is open to a usage-based monitoring discount",
  },
]

const CURRENT_PROGRESSIVE = {
  monthly: 100,
  annual: 1200,
}

export default function InsuranceQuoteTool() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedInsurer, setSelectedInsurer] = useState<string | null>(null)
  const [newQuote, setNewQuote] = useState<Omit<Quote, "id">>({
    insurer: "",
    monthlyPremium: "",
    coverageType: "Liability Only",
    deductible: "",
    notes: "",
    dateObtained: new Date().toISOString().split("T")[0],
    agentName: "",
    agentPhone: "",
    rating: "",
  })

  const addQuote = () => {
    if (!newQuote.insurer || !newQuote.monthlyPremium) return
    setQuotes([...quotes, { ...newQuote, id: crypto.randomUUID() }])
    setNewQuote({
      insurer: "",
      monthlyPremium: "",
      coverageType: "Liability Only",
      deductible: "",
      notes: "",
      dateObtained: new Date().toISOString().split("T")[0],
      agentName: "",
      agentPhone: "",
      rating: "",
    })
    setShowAddForm(false)
  }

  const removeQuote = (id: string) => {
    setQuotes(quotes.filter((q) => q.id !== id))
  }

  const getActualQuote = (insurerName: string) => {
    return quotes.find((q) => q.insurer.toLowerCase().includes(insurerName.toLowerCase()))
  }

  const getEffectiveMonthly = (estimate: InsurerEstimate): number => {
    const actual = getActualQuote(estimate.name)
    if (actual) return parseFloat(actual.monthlyPremium.replace(/[^0-9.]/g, ""))
    return estimate.estimatedMonthly
  }

  const sortedEstimates = [...INSURER_ESTIMATES].sort(
    (a, b) => getEffectiveMonthly(a) - getEffectiveMonthly(b)
  )

  const bestOption = sortedEstimates[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-3 py-4 sm:p-8 space-y-4 sm:space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
            Insurance Quote Helper
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Compare options and find a better deal. Currently paying{" "}
            <span className="font-semibold text-red-600">$100+/month</span> with Progressive.
          </p>
        </header>

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-green-600 text-white">Top Pick</Badge>
                <span className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">
                  {bestOption.name}
                </span>
              </div>
              <span className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                ~${getEffectiveMonthly(bestOption)}/mo
                {getActualQuote(bestOption.name) ? " (actual)" : " (est.)"}
              </span>
              <span className="sm:ml-auto text-sm text-green-600 dark:text-green-400 font-medium">
                Save ~${CURRENT_PROGRESSIVE.monthly - getEffectiveMonthly(bestOption)}/mo
                {" "}(${(CURRENT_PROGRESSIVE.monthly - getEffectiveMonthly(bestOption)) * 12}/yr)
              </span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="compare" className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="compare" className="flex-1 min-w-fit text-xs sm:text-sm px-2 sm:px-4">Compare</TabsTrigger>
            <TabsTrigger value="details" className="flex-1 min-w-fit text-xs sm:text-sm px-2 sm:px-4">Details</TabsTrigger>
            <TabsTrigger value="quotes" className="flex-1 min-w-fit text-xs sm:text-sm px-2 sm:px-4">Quotes ({quotes.length})</TabsTrigger>
            <TabsTrigger value="call-script" className="flex-1 min-w-fit text-xs sm:text-sm px-2 sm:px-4">Script</TabsTrigger>
            <TabsTrigger value="tips" className="flex-1 min-w-fit text-xs sm:text-sm px-2 sm:px-4">Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="compare" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
                <CardDescription>
                  Estimated rates for your profile: 74-year-old, clean record, 1999 Ford Econoline, liability only, Kansas.
                  Actual quotes you enter will replace the estimates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mobile card layout */}
                <div className="sm:hidden space-y-3">
                  <div className="border rounded-lg p-3 bg-red-50 dark:bg-red-950/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">Progressive</span>
                        <Badge variant="destructive" className="text-xs">Current</Badge>
                      </div>
                      <span className="font-bold text-red-600 text-lg">$100+/mo</span>
                    </div>
                  </div>
                  {sortedEstimates.map((est, idx) => {
                    const actual = getActualQuote(est.name)
                    const monthly = getEffectiveMonthly(est)
                    const savingsMonthly = CURRENT_PROGRESSIVE.monthly - monthly
                    return (
                      <div
                        key={est.name}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          idx === 0
                            ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                        onClick={() => setSelectedInsurer(selectedInsurer === est.name ? null : est.name)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{est.name}</span>
                            {idx === 0 && <Badge className="bg-green-600 text-white text-xs">Best</Badge>}
                            {actual && <Badge variant="secondary" className="text-xs">Actual</Badge>}
                          </div>
                          <span className="text-lg font-bold text-slate-900 dark:text-slate-50">${monthly}/mo</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {!actual ? `Est. $${est.estimatedRange[0]}–$${est.estimatedRange[1]}` : est.coverageType}
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            Save ${savingsMonthly}/mo
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{est.bestFor}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop table layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4"></th>
                        <th className="text-left py-3 pr-4">Monthly</th>
                        <th className="text-left py-3 pr-4">Annual</th>
                        <th className="text-left py-3 pr-4">vs Progressive</th>
                        <th className="text-left py-3 pr-4">Key Discounts</th>
                        <th className="text-left py-3">Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-red-50 dark:bg-red-950/30 text-slate-500">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Progressive</span>
                            <Badge variant="destructive" className="text-xs">Current</Badge>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-bold text-red-600">$100+</td>
                        <td className="py-3 pr-4">$1,200+</td>
                        <td className="py-3 pr-4">—</td>
                        <td className="py-3 pr-4 text-xs">Defensive driving only</td>
                        <td className="py-3 text-xs">Not competitive for this profile</td>
                      </tr>
                      {sortedEstimates.map((est, idx) => {
                        const actual = getActualQuote(est.name)
                        const monthly = getEffectiveMonthly(est)
                        const annual = monthly * 12
                        const savingsAnnual = CURRENT_PROGRESSIVE.annual - annual
                        return (
                          <tr
                            key={est.name}
                            className={`border-b cursor-pointer transition-colors ${
                              idx === 0
                                ? "bg-green-50 dark:bg-green-950/30"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                            onClick={() => setSelectedInsurer(selectedInsurer === est.name ? null : est.name)}
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{est.name}</span>
                                {idx === 0 && <Badge className="bg-green-600 text-white text-xs">Best</Badge>}
                                {actual && <Badge variant="secondary" className="text-xs">Actual</Badge>}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                ${monthly}
                              </span>
                              {!actual && (
                                <span className="text-xs text-slate-400 block">
                                  est. ${est.estimatedRange[0]}–${est.estimatedRange[1]}
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-4">${annual.toLocaleString()}</td>
                            <td className="py-3 pr-4">
                              <span className="font-semibold text-green-600">
                                Save ${savingsAnnual.toLocaleString()}/yr
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-xs max-w-[200px]">
                              {est.availableDiscounts.slice(0, 2).join(", ")}
                            </td>
                            <td className="py-3 text-xs max-w-[200px]">{est.bestFor}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Tap any option for details. Estimates based on typical Kansas rates for this profile.
                </p>
              </CardContent>
            </Card>

            {selectedInsurer && (
              <SelectedInsurerDetail
                estimate={INSURER_ESTIMATES.find((e) => e.name === selectedInsurer)!}
                actualQuote={getActualQuote(selectedInsurer) || null}
                currentMonthly={CURRENT_PROGRESSIVE.monthly}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Based on your profile (74, clean record, defensive driving cert, 1999 van, liability only, Kansas),
                    here&apos;s the recommended approach:
                  </p>
                  <div className="space-y-2">
                    <RecommendationStep
                      number={1}
                      title="Start with Kansas Farm Bureau"
                      text="Likely the cheapest. They specialize in Kansas drivers and are consistently the best for local/rural driving with older vehicles. Call a local agent."
                    />
                    <RecommendationStep
                      number={2}
                      title="Get a GEICO quote online"
                      text="Takes 10 minutes at geico.com. No phone call needed. Good backup option if Farm Bureau doesn't work out."
                    />
                    <RecommendationStep
                      number={3}
                      title="Check State Farm if you can bundle"
                      text="If grandma has homeowner's insurance, State Farm's bundle discount (15-20% off) could beat everyone else."
                    />
                    <RecommendationStep
                      number={4}
                      title="Use the best quote to negotiate"
                      text="Once you have 2-3 quotes, call the others back and ask them to match or beat the lowest price."
                    />
                  </div>
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  <p><strong>Expected savings:</strong> $30–$50/month ($360–$600/year) compared to Progressive</p>
                  <p><strong>Time to complete:</strong> 1-2 weeks of phone calls, or start with GEICO online today</p>
                  <p><strong>Important:</strong> Start the new policy BEFORE canceling Progressive — never let coverage lapse</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Driver Information</CardTitle>
                  <CardDescription>Details to have ready when calling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Age" value={`${DRIVER_INFO.age}`} />
                  <InfoRow label="Date of Birth" value={DRIVER_INFO.dob} />
                  <InfoRow label="License #" value={DRIVER_INFO.licenseNumber} />
                  <InfoRow label="License State" value={DRIVER_INFO.licenseState} />
                  <InfoRow label="Licensed Since" value={DRIVER_INFO.licenseHeldSince} />
                  <InfoRow label="Driving Record" value={DRIVER_INFO.record} />
                  <InfoRow label="Defensive Driving" value="Yes (discount applied)" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                  <CardDescription>1999 Ford Econoline Van</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Year/Make/Model" value={`${VEHICLE_INFO.year} ${VEHICLE_INFO.make} ${VEHICLE_INFO.model}`} />
                  <InfoRow label="VIN" value={VEHICLE_INFO.vin} />
                  <InfoRow label="Primary Use" value={VEHICLE_INFO.usage} />
                  <InfoRow label="Coverage Needed" value={VEHICLE_INFO.coverageType} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Policy (Progressive)</CardTitle>
                <CardDescription>What we&apos;re trying to beat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Monthly:</span>
                    <Badge variant="destructive" className="text-base sm:text-lg px-3 py-1">$100+/month</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Discounts:</span>
                    <Badge variant="secondary">Defensive driving</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Target:</span>
                    <Badge className="bg-green-600 text-white text-base sm:text-lg px-3 py-1">$50–$70/month</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kansas Liability Minimums (25/50/25)</CardTitle>
                <CardDescription>All quotes should meet at least these limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">$25K</p>
                    <p className="text-xs text-slate-500">Per person<br />bodily injury</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">$50K</p>
                    <p className="text-xs text-slate-500">Per accident<br />bodily injury</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">$25K</p>
                    <p className="text-xs text-slate-500">Property<br />damage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Actual Quotes</h2>
                <p className="text-sm text-slate-500">Enter real quotes to replace estimates in the comparison</p>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? "Cancel" : "+ Add Quote"}
              </Button>
            </div>

            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Quote</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insurer">Insurance Company</Label>
                      <Select
                        value={newQuote.insurer}
                        onValueChange={(v) => setNewQuote({ ...newQuote, insurer: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select insurer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GEICO">GEICO</SelectItem>
                          <SelectItem value="State Farm">State Farm</SelectItem>
                          <SelectItem value="Travelers">Travelers</SelectItem>
                          <SelectItem value="Kansas Farm Bureau">Kansas Farm Bureau</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="premium">Monthly Premium ($)</Label>
                      <Input
                        id="premium"
                        placeholder="e.g. 65"
                        value={newQuote.monthlyPremium}
                        onChange={(e) => setNewQuote({ ...newQuote, monthlyPremium: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverage">Coverage Type</Label>
                      <Select
                        value={newQuote.coverageType}
                        onValueChange={(v) => setNewQuote({ ...newQuote, coverageType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Liability Only">Liability Only</SelectItem>
                          <SelectItem value="Liability + Uninsured Motorist">Liability + Uninsured Motorist</SelectItem>
                          <SelectItem value="Full Coverage">Full Coverage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deductible">Deductible</Label>
                      <Input
                        id="deductible"
                        placeholder="e.g. $500"
                        value={newQuote.deductible}
                        onChange={(e) => setNewQuote({ ...newQuote, deductible: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent">Agent Name</Label>
                      <Input
                        id="agent"
                        placeholder="Agent name"
                        value={newQuote.agentName}
                        onChange={(e) => setNewQuote({ ...newQuote, agentName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentPhone">Agent Phone</Label>
                      <Input
                        id="agentPhone"
                        placeholder="Phone number"
                        value={newQuote.agentPhone}
                        onChange={(e) => setNewQuote({ ...newQuote, agentPhone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date Obtained</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newQuote.dateObtained}
                        onChange={(e) => setNewQuote({ ...newQuote, dateObtained: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Your Rating</Label>
                      <Select
                        value={newQuote.rating}
                        onValueChange={(v) => setNewQuote({ ...newQuote, rating: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Rate experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Great">Great</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Okay">Okay</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any details about the quote, discounts offered, etc."
                      value={newQuote.notes}
                      onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                    />
                  </div>
                  <Button onClick={addQuote} className="w-full">Save Quote</Button>
                </CardContent>
              </Card>
            )}

            {quotes.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-slate-500">
                  <p className="text-lg">No actual quotes entered yet.</p>
                  <p className="text-sm mt-1">The Compare tab shows estimates. Add real quotes here as you get them — they&apos;ll replace the estimates automatically.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {quotes
                  .sort((a, b) => {
                    const aNum = parseFloat(a.monthlyPremium.replace(/[^0-9.]/g, ""))
                    const bNum = parseFloat(b.monthlyPremium.replace(/[^0-9.]/g, ""))
                    return aNum - bNum
                  })
                  .map((quote, idx) => (
                    <Card key={quote.id} className={idx === 0 ? "border-green-300 dark:border-green-700" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold">{quote.insurer}</span>
                              {idx === 0 && quotes.length > 1 && (
                                <Badge className="bg-green-600 text-white">Best Actual Quote</Badge>
                              )}
                              {quote.rating && <Badge variant="outline">{quote.rating}</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                ${quote.monthlyPremium.replace(/[^0-9.]/g, "")}/mo
                              </span>
                              <span>{quote.coverageType}</span>
                              {quote.deductible && <span>Deductible: {quote.deductible}</span>}
                            </div>
                            {quote.agentName && (
                              <p className="text-sm text-slate-500">
                                Agent: {quote.agentName} {quote.agentPhone && `(${quote.agentPhone})`}
                              </p>
                            )}
                            {quote.notes && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{quote.notes}</p>}
                            <p className="text-xs text-slate-400">Quoted on {quote.dateObtained}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeQuote(quote.id)}>
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="call-script" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Before You Call — Checklist</CardTitle>
                <CardDescription>Have these ready before dialing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ChecklistItem label="Driver's license (K01035833)" />
                <ChecklistItem label="VIN number (1FDRE1424XHA37005)" />
                <ChecklistItem label="Current Progressive policy number" />
                <ChecklistItem label="Defensive driving certificate" />
                <ChecklistItem label="Pen and paper for writing down quotes" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What to Say</CardTitle>
                <CardDescription>A simple script to follow when calling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScriptBlock
                  step={1}
                  title="Introduction"
                  text={`"Hi, I'm calling to get a quote for auto insurance. I'm looking for liability coverage on a 1999 Ford Econoline van."`}
                />
                <ScriptBlock
                  step={2}
                  title="Key Details to Mention"
                  text={`"I'm 74 years old with a Kansas driver's license. I've had my license since 1967 — that's about 59 years. I have a completely clean driving record, no tickets or accidents. I also have a defensive driving course certificate."`}
                />
                <ScriptBlock
                  step={3}
                  title="Coverage Request"
                  text={`"I only need standard liability coverage. The van is mostly used for local driving around town."`}
                />
                <ScriptBlock
                  step={4}
                  title="Ask About Discounts"
                  text={`"Do you offer any discounts for: senior/mature drivers, defensive driving course, low mileage, paying in full, or bundling with homeowner's insurance?"`}
                />
                <ScriptBlock
                  step={5}
                  title="Get the Details"
                  text={`"Can you tell me: the monthly premium, what's included in the coverage, the deductible amount, and your name and direct number in case I have questions?"`}
                />
                <ScriptBlock
                  step={6}
                  title="Close Without Committing"
                  text={`"Thank you! I'm comparing a few options right now. Can I call you back within the week if I'd like to move forward?"`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Discounts to Ask About</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">$</span>
                    <span><strong>Defensive driving discount</strong> — Already have the certificate, make sure it&apos;s applied</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">$</span>
                    <span><strong>Senior/mature driver discount</strong> — Most companies offer 5-15% for ages 55+</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">$</span>
                    <span><strong>Low mileage discount</strong> — Local driving means fewer miles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">$</span>
                    <span><strong>Pay-in-full discount</strong> — 5-10% off for paying 6 months at once</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">$</span>
                    <span><strong>Loyalty/transfer discount</strong> — Some insurers reward switching from a competitor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">$</span>
                    <span><strong>Multi-policy bundle</strong> — Home + auto together usually saves 10-20%</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why $50–$70/month is Realistic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>For liability-only coverage on a 1999 vehicle with a clean 59-year driving record, $50–$70/month is a very reasonable target. Here&apos;s why Progressive may be charging more:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Progressive tends to be less competitive for older drivers with older vehicles</li>
                  <li>Their pricing model may not reward the full value of a 59-year clean record</li>
                  <li>Kansas Farm Bureau and State Farm often have better rates for Kansas residents</li>
                  <li>GEICO&apos;s online model keeps overhead low, which can mean better rates</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strategy Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="space-y-3">
                  <TipBlock
                    number={1}
                    title="Get all quotes before deciding"
                    text="Don't switch after the first good quote. Collect all four and compare."
                  />
                  <TipBlock
                    number={2}
                    title="Ask each insurer to beat the best quote"
                    text="Once you have the lowest quote, call the others back and ask if they can match or beat it."
                  />
                  <TipBlock
                    number={3}
                    title="Check Kansas minimum liability limits"
                    text="Kansas requires 25/50/25 minimum ($25K per person injury, $50K per accident injury, $25K property damage). Make sure all quotes meet at least this."
                  />
                  <TipBlock
                    number={4}
                    title="Consider uninsured motorist coverage"
                    text="It's cheap to add and protects you if hit by someone without insurance. Worth asking the price."
                  />
                  <TipBlock
                    number={5}
                    title="Ask about the cancellation process at Progressive"
                    text="Before switching, ask Progressive if there's a cancellation fee or if you'll get a prorated refund."
                  />
                  <TipBlock
                    number={6}
                    title="Don't let the current policy lapse"
                    text="Start the new policy BEFORE canceling Progressive. A gap in coverage can raise future rates."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SelectedInsurerDetail({
  estimate,
  actualQuote,
  currentMonthly,
}: {
  estimate: InsurerEstimate
  actualQuote: Quote | null
  currentMonthly: number
}) {
  const monthly = actualQuote
    ? parseFloat(actualQuote.monthlyPremium.replace(/[^0-9.]/g, ""))
    : estimate.estimatedMonthly

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg">{estimate.name}</CardTitle>
          <div className="sm:text-right">
            <p className="text-2xl font-bold">${monthly}/mo</p>
            <p className="text-sm text-green-600">Save ${currentMonthly - monthly}/mo vs Progressive</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-2">Pros</h4>
            <ul className="space-y-1">
              {estimate.pros.map((pro) => (
                <li key={pro} className="text-sm flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">+</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-2">Cons</h4>
            <ul className="space-y-1">
              {estimate.cons.map((con) => (
                <li key={con} className="text-sm flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">-</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-semibold text-sm mb-2">Available Discounts</h4>
          <div className="flex flex-wrap gap-2">
            {estimate.availableDiscounts.map((d) => (
              <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-1">How to Get This Quote</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{estimate.howToGet}</p>
          <p className="text-sm text-slate-500 mt-2">Phone: {estimate.phone}</p>
        </div>

        {actualQuote && (
          <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-1">Your Actual Quote</h4>
            <p className="text-sm">${actualQuote.monthlyPremium}/mo — {actualQuote.coverageType}</p>
            {actualQuote.agentName && <p className="text-sm text-slate-500">Agent: {actualQuote.agentName} {actualQuote.agentPhone && `(${actualQuote.agentPhone})`}</p>}
            {actualQuote.notes && <p className="text-sm text-slate-500 mt-1">{actualQuote.notes}</p>}
          </div>
        )}

        <div className="border-t pt-3">
          <h4 className="font-semibold text-sm mb-2">If You Choose {estimate.name} — Next Steps</h4>
          <ol className="space-y-1 text-sm text-slate-600 dark:text-slate-400 list-decimal pl-4">
            <li>Call {estimate.name} and confirm the quote / finalize the policy details</li>
            <li>Ask for the policy start date — set it for the day you want to switch</li>
            <li>Once the new policy is confirmed and active, call Progressive to cancel</li>
            <li>Ask Progressive for a prorated refund on any remaining premium</li>
            <li>Keep proof of the new policy in the van</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2 text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-slate-500 text-xs sm:text-sm">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100 font-mono text-sm break-all">{value}</span>
    </div>
  )
}

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false)
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={label}
        checked={checked}
        onCheckedChange={(v) => setChecked(v === true)}
      />
      <label
        htmlFor={label}
        className={`text-sm ${checked ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300"}`}
      >
        {label}
      </label>
    </div>
  )
}

function ScriptBlock({ step, title, text }: { step: number; title: string; text: string }) {
  return (
    <div className="border-l-4 border-blue-300 dark:border-blue-700 pl-4 space-y-1">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">Step {step}</Badge>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 italic">{text}</p>
    </div>
  )
}

function TipBlock({ number, title, text }: { number: number; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
        {number}
      </span>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-slate-500 text-xs">{text}</p>
      </div>
    </div>
  )
}

function RecommendationStep({ number, title, text }: { number: number; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 flex items-center justify-center text-sm font-bold">
        {number}
      </span>
      <div>
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-slate-600 dark:text-slate-400 text-xs">{text}</p>
      </div>
    </div>
  )
}
