import * as React from 'react';

interface QuoteEmailTemplateProps {
  studentName: string;
  teacherName: string;
  description: string;
  amount: string;
  duration: string;
  notes?: string;
}

export function QuoteEmailTemplate({
  studentName,
  teacherName,
  description,
  amount,
  duration,
  notes
}: QuoteEmailTemplateProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>Quote for Your Booking Request</h1>
        
        <p style={{ color: '#374151', marginBottom: '16px' }}>
          Hi {studentName},
        </p>
        
        <p style={{ color: '#374151', marginBottom: '20px' }}>
          Thank you for your booking request! I've prepared a quote for you based on your needs.
        </p>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
          <h3 style={{ color: '#1f2937', marginTop: '0', marginBottom: '16px' }}>Quote Details</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#374151' }}>Service:</strong>
            <span style={{ color: '#6b7280', marginLeft: '8px' }}>{description}</span>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#374151' }}>Amount:</strong>
            <span style={{ color: '#059669', marginLeft: '8px', fontSize: '18px', fontWeight: 'bold' }}>${amount}</span>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#374151' }}>Duration:</strong>
            <span style={{ color: '#6b7280', marginLeft: '8px' }}>{duration} hours</span>
          </div>
          
          {notes && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
              <strong style={{ color: '#374151' }}>Additional Notes:</strong>
              <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>{notes}</p>
            </div>
          )}
        </div>
        
        <div style={{ backgroundColor: '#e0f2fe', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
          <p style={{ color: '#0277bd', margin: '0', fontWeight: '500' }}>
            💡 Ready to proceed? Simply reply to this email to confirm your booking and discuss next steps.
          </p>
        </div>
        
        <p style={{ color: '#374151', marginBottom: '8px' }}>
          Best regards,<br />
          <strong>{teacherName}</strong>
        </p>
        
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />
        
        <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0' }}>
          This quote is valid for 7 days. If you have any questions, please don't hesitate to reach out.
        </p>
      </div>
    </div>
  );
}
