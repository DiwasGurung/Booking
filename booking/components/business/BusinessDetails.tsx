import { Business } from "../../lib/types";

interface Props {
  business: Business;
}

export const BusinessDetails = ({ business }: Props) => {
  return (
    <div className="border rounded p-4 shadow">
      <h1 className="text-2xl font-bold">{business.name}</h1>
      <p className="text-gray-600">{business.category} - {business.location}</p>
      <p className="mt-2">{business.description}</p>
    </div>
  );
};
