import Link from "next/link";
import { Business } from "../../lib/types"

interface Props {
  business: Business;
}

export const BusinessCard = ({ business }: Props) => {
  return (
    <Link href={`/businesses/${business.id}`} className="border rounded p-4 hover:shadow-lg">
      <h2 className="text-xl font-bold">{business.name}</h2>
      <p>{business.category}</p>
      <p>{business.location}</p>
    </Link>
  );
};
