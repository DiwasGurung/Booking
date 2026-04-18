"use client";

import { useState } from "react";
import {
  cancelBooking,
  updateBookingStatus,
  deleteBooking,
} from "@/lib/booking.api";
import { Button } from "@/components/ui/Button";

interface BookingDetailsProps {
  booking: {
    id: string;
    status: string;
    date: string;
    time?: string;
    serviceName: string;
    businessName: string;
    customerName?: string;
  };
  isBusinessOwner?: boolean;
}

export default function BookingDetails({
  booking,
  isBusinessOwner = false,
}: BookingDetailsProps) {
  const [status, setStatus] = useState(booking.status);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setLoading(true);
      await cancelBooking(booking.id);
      setStatus("CANCELLED");
      alert("Booking cancelled");
    } catch (error) {
      alert("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      await updateBookingStatus(booking.id, newStatus);
      setStatus(newStatus);
      alert("Status updated");
    } catch (error) {
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("This action cannot be undone. Delete booking?")) return;

    try {
      setLoading(true);
      await deleteBooking(booking.id);
      alert("Booking deleted");
    } catch (error) {
      alert("Failed to delete booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto border rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-bold">Booking Details</h2>

      <div className="space-y-1">
        <p>
          <strong>Service:</strong> {booking.serviceName}
        </p>
        <p>
          <strong>Business:</strong> {booking.businessName}
        </p>
        <p>
          <strong>Date:</strong> {booking.date}
        </p>
        {booking.time && (
          <p>
            <strong>Time:</strong> {booking.time}
          </p>
        )}
        <p>
          <strong>Status:</strong>{" "}
          <span className="font-semibold">{status}</span>
        </p>
        {booking.customerName && (
          <p>
            <strong>Customer:</strong> {booking.customerName}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {status !== "CANCELLED" && (
          <Button
            onClick={handleCancel}
            disabled={loading}
            variant="destructive"
          >
            Cancel Booking
          </Button>
        )}

        {isBusinessOwner && (
          <>
            <Button
              onClick={() => handleStatusUpdate("CONFIRMED")}
              disabled={loading || status === "CONFIRMED"}
            >
              Confirm
            </Button>
            <Button
              onClick={() => handleStatusUpdate("COMPLETED")}
              disabled={loading || status === "COMPLETED"}
            >
              Complete
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              variant="outline"
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
