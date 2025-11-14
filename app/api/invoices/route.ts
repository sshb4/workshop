import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTrouteClient, createInvoiceFromBooking } from '@/lib/troute-client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')

    if (invoiceId) {
      // Get specific invoice
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          teacherId: teacher.id
        },
        include: {
          items: true,
          booking: true
        }
      })

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      return NextResponse.json({ invoice })
    } else {
      // Get all invoices for teacher
      const invoices = await prisma.invoice.findMany({
        where: {
          teacherId: teacher.id
        },
        include: {
          items: true,
          booking: {
            select: {
              studentName: true,
              studentEmail: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json({ invoices })
    }
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await request.json()
    const { bookingId, customInvoiceData } = body

    if (bookingId) {
      // Create invoice from booking
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          teacherId: teacher.id
        }
      })

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // Check if invoice already exists for this booking
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          bookingId: booking.id
        }
      })

      if (existingInvoice) {
        return NextResponse.json(
          { error: 'Invoice already exists for this booking' },
          { status: 409 }
        )
      }

      // Create invoice data from booking
      const invoiceData = createInvoiceFromBooking(booking, teacher)

      // Send to Troute API
      const trouteClient = createTrouteClient()
      const trouteResponse = await trouteClient.createInvoice(invoiceData)

      if (trouteResponse.error || !trouteResponse.invoice) {
        return NextResponse.json(
          { error: 'Failed to create invoice with Troute API' },
          { status: 500 }
        )
      }

      // Save invoice to our database
      const invoice = await prisma.invoice.create({
        data: {
          teacherId: teacher.id,
          bookingId: booking.id,
          trouteInvoiceId: trouteResponse.invoice.uniqueID?.toString(),
          invoiceNumber: trouteResponse.invoice.invoice_number,
          status: trouteResponse.invoice.status,
          amount: parseFloat(trouteResponse.invoice.amount),
          discount: parseFloat(trouteResponse.invoice.discount || '0'),
          tax: parseFloat(trouteResponse.invoice.tax || '0'),
          shipping: parseFloat(trouteResponse.invoice.shipping || '0'),
          surcharge: parseFloat(trouteResponse.invoice.surcharge || '0'),
          notes: trouteResponse.invoice.notes || '',
          dueDate: new Date(trouteResponse.invoice.due_date),
          items: {
            create: trouteResponse.invoice.items.map(item => ({
              title: item.title,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price
            }))
          }
        },
        include: {
          items: true,
          booking: true
        }
      })

      return NextResponse.json({ invoice, trouteInvoice: trouteResponse.invoice })
    } else if (customInvoiceData) {
      // Create custom invoice
      const trouteClient = createTrouteClient()
      const trouteResponse = await trouteClient.createInvoice(customInvoiceData)

      if (trouteResponse.error || !trouteResponse.invoice) {
        return NextResponse.json(
          { error: 'Failed to create invoice with Troute API' },
          { status: 500 }
        )
      }

      // Save invoice to our database  
      const invoice = await prisma.invoice.create({
        data: {
          teacherId: teacher.id,
          trouteInvoiceId: trouteResponse.invoice.uniqueID?.toString(),
          invoiceNumber: trouteResponse.invoice.invoice_number,
          status: trouteResponse.invoice.status,
          amount: parseFloat(trouteResponse.invoice.amount),
          discount: parseFloat(trouteResponse.invoice.discount || '0'),
          tax: parseFloat(trouteResponse.invoice.tax || '0'),
          shipping: parseFloat(trouteResponse.invoice.shipping || '0'),
          surcharge: parseFloat(trouteResponse.invoice.surcharge || '0'),
          notes: trouteResponse.invoice.notes || '',
          dueDate: new Date(trouteResponse.invoice.due_date),
          items: {
            create: trouteResponse.invoice.items.map(item => ({
              title: item.title,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price
            }))
          }
        },
        include: {
          items: true
        }
      })

      return NextResponse.json({ invoice, trouteInvoice: trouteResponse.invoice })
    } else {
      return NextResponse.json(
        { error: 'Either bookingId or customInvoiceData is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await request.json()
    const { invoiceId, updates } = body

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        teacherId: teacher.id
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Update on Troute API if we have an external ID
    if (invoice.trouteInvoiceId && updates.trouteData) {
      const trouteClient = createTrouteClient()
      await trouteClient.updateInvoice({
        uniqueID: parseInt(invoice.trouteInvoiceId),
        ...updates.trouteData
      })
    }

    // Update local database
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: updates.status || invoice.status,
        notes: updates.notes !== undefined ? updates.notes : invoice.notes,
        dateClosed: updates.status === 'Paid' && !invoice.dateClosed ? new Date() : invoice.dateClosed
      },
      include: {
        items: true,
        booking: true
      }
    })

    return NextResponse.json({ invoice: updatedInvoice })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        teacherId: teacher.id
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Delete from Troute API if external ID exists
    if (invoice.trouteInvoiceId) {
      try {
        const trouteClient = createTrouteClient()
        await trouteClient.deleteInvoice(parseInt(invoice.trouteInvoiceId))
      } catch (error) {
        console.warn('Failed to delete from Troute API:', error)
        // Continue with local deletion even if external deletion fails
      }
    }

    // Delete from local database
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
