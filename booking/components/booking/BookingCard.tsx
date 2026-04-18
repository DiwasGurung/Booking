import Link from "next/link";
import { Booking } from "../../lib/types";

interface Props {
  booking: Booking;
}

export const BookingCard = ({ booking }: Props) => {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="border p-4 rounded shadow hover:bg-gray-50 block"
    >
      <h3 className="font-bold">{booking.name}</h3>
      <p>{booking.date} at {booking.time}</p>
      <p className="text-sm text-gray-600">{booking.email}</p>
    </Link>
  );
};
