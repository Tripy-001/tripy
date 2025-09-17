'use client';

import { TripCreationForm } from './TripCreationForm';

// This is a test component to verify the form works
export const TestTripForm = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Trip Creation Form Test</h1>
        <TripCreationForm />
      </div>
    </div>
  );
};
