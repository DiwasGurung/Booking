'use client'

import { useState } from 'react'
import { Loader, AlertCircle, Building2, Plus, Pencil, Trash2, MapPin, Phone, Star } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { branchApi, type Branch } from '@/lib/api'
import { useBranches } from '@/context/branchContext'

const EMPTY = { name: '', phone: '', address: '', city: '', state: '' }

export default function BranchesPage() {
  const { branches, limit, loading, refresh } = useBranches()
  const [editing, setEditing] = useState<Branch | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const atLimit = limit !== -1 && branches.length >= limit

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); setError(null) }
  const openEdit = (b: Branch) => {
    setEditing(b)
    setForm({ name: b.name, phone: b.phone ?? '', address: b.address, city: b.city, state: b.state ?? '' })
    setShowForm(true)
    setError(null)
  }

  const save = async () => {
    if (!form.name || !form.address || !form.city) {
      setError('Name, address and city are required')
      return
    }
    setSaving(true)
    setError(null)
    const res = editing ? await branchApi.update(editing.id, form) : await branchApi.create(form)
    setSaving(false)
    if (!res.success) {
      setError(res.error || 'Failed to save branch')
      return
    }
    setShowForm(false)
    await refresh()
  }

  const remove = async (b: Branch) => {
    if (!confirm(`Delete "${b.name}"? This cannot be undone.`)) return
    const res = await branchApi.remove(b.id)
    if (!res.success) { setError(res.error || 'Failed to delete branch'); return }
    await refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />
      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Branches' }]} />

        <div className="flex justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Branches</h1>
            <p className="text-slate-500">
              {limit === -1 ? 'Unlimited branches' : `${branches.length} of ${limit} branch${limit === 1 ? '' : 'es'} used`}
            </p>
          </div>
          <Button onClick={openNew} disabled={atLimit}>
            <Plus className="w-4 h-4 mr-2" /> Add Branch
          </Button>
        </div>

        {atLimit && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
            Your plan allows {limit} branch{limit === 1 ? '' : 'es'}. Upgrade to add more locations.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="font-medium text-red-900">{error}</p>
          </div>
        )}

        {showForm && (
          <Card className="border border-slate-200 shadow-sm p-6 bg-white mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editing ? 'Edit Branch' : 'New Branch'}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(['name', 'phone', 'address', 'city', 'state'] as const).map((k) => (
                <div key={k}>
                  <Label htmlFor={k} className="capitalize">{k}</Label>
                  <Input id={k} className="mt-2" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? <><Loader className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Branch'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="p-12 flex justify-center"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((b) => (
              <Card key={b.id} className="border border-slate-200 shadow-sm p-6 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-2 rounded-lg"><Building2 className="w-5 h-5 text-blue-600" /></div>
                    <p className="font-semibold text-slate-900">{b.name}</p>
                  </div>
                  <div className="flex gap-1">
                    {b.isMain && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Star className="w-3 h-3 mr-1" />Main</Badge>}
                    {!b.isActive && <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Inactive</Badge>}
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />{b.address}, {b.city}
                </p>
                {b.phone && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />{b.phone}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                    <Pencil className="w-4 h-4 mr-1" />Edit
                  </Button>
                  {!b.isMain && (
                    <Button size="sm" variant="outline" onClick={() => remove(b)}>
                      <Trash2 className="w-4 h-4 mr-1" />Delete
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}