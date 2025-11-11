"use client";
import React, { useState } from "react";

import type { ColorScheme } from '@/lib/themes';

interface BookingSettings {
  form_fields?: string | Record<string, boolean> | Array<CustomField>;
}

interface ManualBookModalProps {
  colorScheme: ColorScheme;
  bookingSettings: BookingSettings;
  teacher: {
    id: string;
    name: string;
    subdomain: string;
    hourlyRate?: number;
    title?: string;
    email?: string;
    profileImage?: string;
    bio?: string;
    phone?: string;
    colorScheme?: string;
  };
}

interface CustomField {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
}

export default function ManualBookModal({ colorScheme, bookingSettings, teacher }: ManualBookModalProps) {
  const [open, setOpen] = useState(false);
  let customFields: CustomField[] = [];
  
  // Parse form_fields from booking settings
  if (bookingSettings?.form_fields) {
    let formFields: Record<string, boolean>;
    
    // If it's a string, try to parse it as JSON
    if (typeof bookingSettings.form_fields === 'string') {
      try {
        const parsed = JSON.parse(bookingSettings.form_fields);
        formFields = parsed as Record<string, boolean>;
      } catch {
        formFields = {};
      }
    } else if (Array.isArray(bookingSettings.form_fields)) {
      // Handle array format (legacy support)
      formFields = {};
      bookingSettings.form_fields.forEach((field: CustomField) => {
        if (field.name) {
          formFields[field.name] = true;
        }
      });
    } else {
      // Assume it's already a Record<string, boolean>
      formFields = bookingSettings.form_fields as Record<string, boolean>;
    }
    
    // Convert the formFields object to an array of CustomField objects
    const fieldDefinitions = [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
      { name: 'address', label: 'Address', type: 'text', required: false },
      { name: 'dates', label: 'Preferred Dates', type: 'text', required: false },
      { name: 'description', label: 'Description/Notes', type: 'textarea', required: false }
    ];
    
    customFields = fieldDefinitions.filter(field => formFields[field.name] === true);
  }
  return (
    <>
      <p className="mb-6 sm:mb-8 text-sm sm:text-lg transition-colors duration-300" style={{ color: colorScheme.styles.textSecondary }}>
        Please fill out the form below to request a booking.
      </p>
      <button
        className="bg-primary text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-primaryHover transition-colors duration-200"
        style={{ backgroundColor: colorScheme.styles.primary, color: colorScheme.styles.textPrimary }}
        onClick={() => setOpen(true)}
      >
        Book Now
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full relative">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setOpen(false)}>&times;</button>
            <h3 className="text-2xl font-bold mb-4" style={{ color: colorScheme.styles.primary }}>Booking Request</h3>
            <form>
              {/* Render custom fields from bookingSettings */}
              {customFields.length > 0 ? (
                customFields.map((field, idx) => (
                  <div key={idx} className="mb-4">
                    <label className="block font-medium mb-1" htmlFor={`field-${idx}`}>{field.label || field.name}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={`field-${idx}`}
                        name={field.name}
                        required={field.required}
                        className="w-full border rounded px-3 py-2 resize-vertical min-h-[80px]"
                        placeholder={`Enter your ${field.label?.toLowerCase() || field.name}`}
                      />
                    ) : (
                      <input
                        id={`field-${idx}`}
                        name={field.name}
                        type={field.type || "text"}
                        required={field.required}
                        className="w-full border rounded px-3 py-2"
                        placeholder={`Enter your ${field.label?.toLowerCase() || field.name}`}
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="mb-4 text-gray-500">No custom fields configured. Please contact the provider.</p>
              )}
              <button type="submit" className="bg-primary text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-primaryHover transition-colors duration-200" style={{ backgroundColor: colorScheme.styles.primary }}>
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
