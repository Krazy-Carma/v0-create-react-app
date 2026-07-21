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

const TARGET_INSURERS = [
  { name: "GEICO", phone: "1-800-861-8380", website: "geico.com", notes: "Online quotes available, often competitive for clean records" },
  { name: "State Farm", phone: "Find local agent", website: "statefarm.com", notes: "Strong in Kansas, agent-based — ask for multi-policy discounts" },
  { name: "Travelers", phone: "Find local agent", website: "travelers.com", notes: "Good for mature drivers, ask about IntelliDrive discount" },
  { name: "Kansas Farm Bureau", phone: "Find local agent", website: "kfb.org", notes: "Kansas-specific, often best rates for rural/local drivers" },
]

export default function InsuranceQuoteTool() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
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

  const bestQuote = quotes.length > 0
    ? quotes.reduce((best, q) => {
        const bestNum = parseFloat(best.monthlyPremium.replace(/[^0-9.]/g, ""))
        const qNum = parseFloat(q.monthlyPremium.replace(/[^0-9.]/g, ""))
        return qNum < bestNum ? q : best
      })
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
            Grandma&apos;s Insurance Quote Helper
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Track quotes, compare prices, and find the best deal. Target: <span className="font-semibold text-green-600 dark:text-green-400">$50–$70/month</span> (currently paying $100+/month with Progressive).
          </p>
        </header>

        {bestQuote && (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-green-600 text-white">Best Quote So Far</Badge>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ${bestQuote.monthlyPremium.replace(/[^0-9.]/g, "")}/mo
                </span>
                <span className="text-slate-600 dark:text-slate-400">from {bestQuote.insurer}</span>
                <span className="ml-auto text-sm text-green-600 dark:text-green-400 font-medium">
                  Saving ${(100 - parseFloat(bestQuote.monthlyPremium.replace(/[^0-9.]/g, ""))).toFixed(0)}/mo vs Progressive
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotes">Quotes ({quotes.length})</TabsTrigger>
            <TabsTrigger value="call-script">Call Script</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Monthly:</span>
                    <Badge variant="destructive" className="text-lg px-3 py-1">$100+/month</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Discounts:</span>
                    <Badge variant="secondary">Defensive driving</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Target:</span>
                    <Badge className="bg-green-600 text-white text-lg px-3 py-1">$50–$70/month</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Insurers to Contact</CardTitle>
                <CardDescription>Get quotes from each of these</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {TARGET_INSURERS.map((insurer) => (
                    <div key={insurer.name} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{insurer.name}</span>
                        {quotes.some((q) => q.insurer.toLowerCase().includes(insurer.name.toLowerCase())) ? (
                          <Badge className="bg-green-600 text-white">Quoted</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{insurer.phone}</p>
                      <p className="text-xs text-slate-400">{insurer.notes}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Collected Quotes</h2>
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
                  <p className="text-lg">No quotes collected yet.</p>
                  <p className="text-sm mt-1">Use the call script tab to start calling, then add quotes here as you get them.</p>
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
                  .map((quote) => (
                    <Card key={quote.id} className={quote.id === bestQuote?.id ? "border-green-300 dark:border-green-700" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold">{quote.insurer}</span>
                              {quote.id === bestQuote?.id && (
                                <Badge className="bg-green-600 text-white">Best Price</Badge>
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

                <Card className="bg-slate-50 dark:bg-slate-800">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Comparison Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4">Insurer</th>
                            <th className="text-left py-2 pr-4">Monthly</th>
                            <th className="text-left py-2 pr-4">Annual</th>
                            <th className="text-left py-2 pr-4">vs Progressive</th>
                            <th className="text-left py-2">Coverage</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b text-slate-400">
                            <td className="py-2 pr-4">Progressive (current)</td>
                            <td className="py-2 pr-4">$100</td>
                            <td className="py-2 pr-4">$1,200</td>
                            <td className="py-2 pr-4">—</td>
                            <td className="py-2">Liability</td>
                          </tr>
                          {quotes
                            .sort((a, b) => {
                              const aNum = parseFloat(a.monthlyPremium.replace(/[^0-9.]/g, ""))
                              const bNum = parseFloat(b.monthlyPremium.replace(/[^0-9.]/g, ""))
                              return aNum - bNum
                            })
                            .map((q) => {
                              const monthly = parseFloat(q.monthlyPremium.replace(/[^0-9.]/g, ""))
                              const annual = monthly * 12
                              const savings = (100 - monthly) * 12
                              return (
                                <tr key={q.id} className="border-b">
                                  <td className="py-2 pr-4 font-medium">{q.insurer}</td>
                                  <td className="py-2 pr-4">${monthly.toFixed(0)}</td>
                                  <td className="py-2 pr-4">${annual.toFixed(0)}</td>
                                  <td className={`py-2 pr-4 font-medium ${savings > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {savings > 0 ? `Save $${savings.toFixed(0)}/yr` : `+$${Math.abs(savings).toFixed(0)}/yr`}
                                  </td>
                                  <td className="py-2">{q.coverageType}</td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <TimelineItem
                    step="Week 1"
                    action="Call GEICO and get an online quote. Call a local State Farm agent."
                  />
                  <TimelineItem
                    step="Week 1-2"
                    action="Call Travelers and Kansas Farm Bureau local agents."
                  />
                  <TimelineItem
                    step="Week 2"
                    action="Compare all quotes. Call back lowest competitors to see if others can beat them."
                  />
                  <TimelineItem
                    step="Week 2-3"
                    action="Choose the best option. Start new policy, THEN cancel Progressive."
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100 font-mono text-xs">{value}</span>
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

function TimelineItem({ step, action }: { step: string; action: string }) {
  return (
    <div className="flex gap-3 items-start">
      <Badge variant="outline" className="flex-shrink-0 text-xs">{step}</Badge>
      <p className="text-slate-700 dark:text-slate-300">{action}</p>
    </div>
  )
}
