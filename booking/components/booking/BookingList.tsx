import { BookingCard } from "./BookingCard";
import { Booking } from "../../lib/types";

interface Props {
  bookings: Booking[];
}

export const BookingList = ({ bookings }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} />
      ))}
    </div>
  );
};
