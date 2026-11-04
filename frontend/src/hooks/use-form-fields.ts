import { useState } from 'react'
import type { ChangeEvent } from 'react'

export const useFormFields = <T extends Record<string, string>>(
  initialValues: T,
) => {
  const [values, setValues] = useState(initialValues)

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  // props de um campo controlado: <AuthField {...field('email')} />
  const field = (name: keyof T & string) => ({
    id: name,
    name,
    value: values[name],
    onChange: handleChange,
  })

  // para campos sem evento de input nativo (ex.: Select do Base UI)
  const setValue = (name: keyof T & string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }))

  return { values, field, setValue }
}
