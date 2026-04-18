import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

// Define a type for field configuration
interface FieldConfig {
  label: string
  name: string
  type: "text" | "number" | "textarea" | "select" | "checkbox"
  options?: { label: string; value: any }[] // for select
  required?: boolean
}

// Props for the generic form
interface GenericFormProps {
  title: string
  fields: FieldConfig[]
  initialValues?: Record<string, any>
  onSubmit: (data: Record<string, any>) => void
  submitText?: string
  loading?: boolean
}

export default function GenericForm({
  title,
  fields,
  initialValues = {},
  onSubmit,
  submitText = "Submit",
  loading = false,
}: GenericFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type } = e.target
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="border p-4 rounded shadow mb-4">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name}>{field.label}</Label>
            {field.type === "text" || field.type === "number" ? (
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                value={formData[field.name] || ""}
                onChange={handleChange}
                required={field.required}
              />
            ) : field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                className="w-full p-2 border border-border rounded-md resize-none"
                rows={4}
                value={formData[field.name] || ""}
                onChange={handleChange}
                required={field.required}
              />
            ) : field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                className="w-full p-2 border border-border rounded-md"
                value={formData[field.name] || ""}
                onChange={handleChange}
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                checked={formData[field.name] || false}
                onChange={handleChange}
                className="ml-2"
              />
            ) : null}
          </div>
        ))}
        <Button type="submit" disabled={loading} className="w-full h-10 font-medium">
          {loading ? "Processing..." : submitText}
        </Button>
      </form>
    </div>
  )
}