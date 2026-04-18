"use client";

import { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Booking } from "../../lib/types";

interface Props {
  businessId: string;
  onBookingCreated: (booking: Booking) => void;
}

export const BookingForm = ({ businessId, onBookingCreated }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const booking: Booking = { id: "", businessId, name, email, date, time };

    // Call mock API
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    const data = await res.json();
    onBookingCreated(data);

    // Reset form
    setName("");
    setEmail("");
    setDate("");
    setTime("");
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded shadow mt-4">
      <h2 className="text-xl font-bold mb-4">Create a Booking</h2>
    </form>
  );
};
