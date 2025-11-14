interface CustomerInformation {
  firstname: string
  lastname: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  phone1: string
  phone2?: string
  email: string
}

interface BillingInformation {
  firstname: string
  lastname: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  email: string
}

interface InvoiceItem {
  title: string
  description: string
  quantity: number
  unit_price: number
}

interface TrouteCustomer {
  uniqueID?: number | null
  customer_information: CustomerInformation
  billing_information: BillingInformation
  custom?: {
    custom1?: string
    custom2?: string
    custom3?: string
    custom4?: string
    custom5?: string
    custom6?: string
    custom7?: string
    custom8?: string
    custom9?: string
    custom10?: string
  }
  customer_payments?: Array<{
    paymentID: number | null
    paymenttype: string
    lastfour: string
    brand: string
  }>
}

interface TrouteInvoice {
  uniqueID?: number | null
  customerID?: number
  customer?: TrouteCustomer
  date_created: string
  due_date: string
  status: 'Paid' | 'Unpaid' | 'Cancelled'
  date_closed?: string
  invoice_number: string
  notes?: string
  amount: string
  discount?: string
  tax?: string
  shipping?: string
  surcharge?: string
  items: InvoiceItem[]
}

interface CreateInvoiceRequest {
  invoice: TrouteInvoice
}

interface TrouteApiResponse<T> {
  invoice?: T
  error?: string
}

export class TrouteApiClient {
  private baseUrl: string
  private accessToken: string

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl
    this.accessToken = accessToken
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PATCH')) {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`Troute API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Troute API request failed:', error)
      throw error
    }
  }

  /**
   * Create a new invoice with customer information
   */
  async createInvoice(invoiceData: TrouteInvoice): Promise<TrouteApiResponse<TrouteInvoice>> {
    const request: CreateInvoiceRequest = {
      invoice: {
        uniqueID: null,
        ...invoiceData,
      }
    }

    return this.makeRequest<TrouteApiResponse<TrouteInvoice>>(
      '/query/expiinvoice',
      'POST',
      request
    )
  }

  /**
   * Create invoice for existing customer
   */
  async createInvoiceForCustomer(
    customerID: number,
    invoiceData: Omit<TrouteInvoice, 'customer' | 'customerID'>
  ): Promise<TrouteApiResponse<TrouteInvoice>> {
    const request: CreateInvoiceRequest = {
      invoice: {
        uniqueID: null,
        customerID,
        ...invoiceData,
      }
    }

    return this.makeRequest<TrouteApiResponse<TrouteInvoice>>(
      '/query/expiinvoice',
      'POST',
      request
    )
  }

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(uniqueID: number): Promise<TrouteApiResponse<TrouteInvoice>> {
    return this.makeRequest<TrouteApiResponse<TrouteInvoice>>(
      `/query/expiinvoice?uniqueID=${uniqueID}`
    )
  }

  /**
   * Get all invoices with optional sorting
   */
  async getInvoices(options?: {
    sort?: string
    modifiers?: string
    filters?: string
  }): Promise<TrouteApiResponse<TrouteInvoice[]>> {
    const params = new URLSearchParams()
    
    if (options?.sort) params.append('sort', options.sort)
    if (options?.modifiers) params.append('modifiers', options.modifiers)
    if (options?.filters) params.append('filters', options.filters)

    const queryString = params.toString() ? `?${params.toString()}` : '?sort'
    
    return this.makeRequest<TrouteApiResponse<TrouteInvoice[]>>(
      `/query/expiinvoice${queryString}`
    )
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(invoiceData: Partial<TrouteInvoice> & { uniqueID: number }): Promise<TrouteApiResponse<TrouteInvoice>> {
    const request: CreateInvoiceRequest = {
      invoice: invoiceData as TrouteInvoice
    }

    return this.makeRequest<TrouteApiResponse<TrouteInvoice>>(
      '/query/expiinvoice',
      'PATCH',
      request
    )
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(uniqueID: number): Promise<void> {
    await this.makeRequest(
      `/query/expiinvoice?uniqueID=${uniqueID}`,
      'DELETE'
    )
  }
}

// Helper function to create invoice from booking data
export function createInvoiceFromBooking(booking: {
  studentName: string
  studentEmail: string
  studentPhone: string
  amountPaid: number
  notes?: string | null
  bookingDate: Date
  startTime: string
  endTime: string
}, teacher: {
  name: string
  hourlyRate?: number | null
}): Omit<TrouteInvoice, 'uniqueID' | 'customerID'> {
  const [firstName, ...lastNameParts] = booking.studentName.split(' ')
  const lastName = lastNameParts.join(' ')
  
  // Generate invoice number (YYYYMMDDHHMMSS format)
  const now = new Date()
  const invoiceNumber = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0')

  // Calculate due date (30 days from now)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  return {
    customer: {
      uniqueID: null,
      customer_information: {
        firstname: firstName || booking.studentName,
        lastname: lastName || '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone1: booking.studentPhone,
        phone2: '',
        email: booking.studentEmail
      },
      billing_information: {
        firstname: firstName || booking.studentName,
        lastname: lastName || '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: booking.studentPhone,
        email: booking.studentEmail
      },
      custom: {},
      customer_payments: []
    },
    date_created: now.toISOString().replace('T', ' ').substring(0, 19),
    due_date: dueDate.toISOString().replace('T', ' ').substring(0, 19),
    status: 'Unpaid' as const,
    date_closed: '',
    invoice_number: invoiceNumber,
    notes: booking.notes || `Workshop session with ${teacher.name}`,
    amount: booking.amountPaid.toString(),
    discount: '0',
    tax: '0',
    shipping: '0',
    surcharge: '0',
    items: [
      {
        title: `Workshop Session - ${booking.bookingDate.toLocaleDateString()}`,
        description: `Session with ${teacher.name} from ${booking.startTime} to ${booking.endTime}`,
        quantity: 1,
        unit_price: booking.amountPaid
      }
    ]
  }
}

// Factory function to create client instance
export function createTrouteClient(): TrouteApiClient {
  const baseUrl = process.env.TROUTE_API_BASE_URL || ''
  const accessToken = process.env.TROUTE_ACCESS_TOKEN || ''

  if (!baseUrl || !accessToken) {
    throw new Error('Troute API configuration missing. Please set TROUTE_API_BASE_URL and TROUTE_ACCESS_TOKEN environment variables.')
  }

  return new TrouteApiClient(baseUrl, accessToken)
}
