import { useRouter } from "next/navigation"
import GenericForm from "@/components/ui/GenericForm"

// Define the fields with explicit 'type' literals
const hoursFields: {
  label: string
  name: string
  type: "select" | "text" | "checkbox"
  options?: { label: string; value: number }[]
  required?: boolean
}[] = [
  {
    label: "Day of Week",
    name: "dayOfWeek",
    type: "select",
    options: [
      { label: "Monday", value: 0 },
      { label: "Tuesday", value: 1 },
      { label: "Wednesday", value: 2 },
      { label: "Thursday", value: 3 },
      { label: "Friday", value: 4 },
      { label: "Saturday", value: 5 },
      { label: "Sunday", value: 6 },
    ],
  },
  { label: "Open Time", name: "openTime", type: "text" },
  { label: "Close Time", name: "closeTime", type: "text" },
  { label: "Closed", name: "isClosed", type: "checkbox" },
]

export default function BusinessHoursPage() {
  const router = useRouter()

  const handleSetHours = async (data: any) => {
    const res = await fetch("/api/business-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      alert("Business hours saved!")
      router.push("/some-other-page")
    } else {
      alert("Failed to save hours")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Set Business Hours</h1>
      <GenericForm
        title="Set Business Hours"
        fields={hoursFields}
        onSubmit={handleSetHours}
        submitText="Save Hours"
      />
    </div>
  )
}