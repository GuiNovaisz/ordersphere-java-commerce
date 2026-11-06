const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dates = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
export const money = (value: number) => brl.format(value)
export const dateTime = (value: string) => dates.format(new Date(value))
export const number = (value: number) => new Intl.NumberFormat('pt-BR').format(value)
export const orderStatus = (value: 'CONFIRMED' | 'CANCELLED') =>
  value === 'CONFIRMED' ? 'Confirmado' : 'Cancelado'
