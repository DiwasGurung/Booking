import { BusinessCard } from "./BusinessCard";
import { Business } from "../../lib/types";

interface Props {
  businesses: Business[];
}

export const BusinessList = ({ businesses }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {businesses.map((b) => (
        <BusinessCard key={b.id} business={b} />
      ))}
    </div>
  );
};
