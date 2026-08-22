import { apiDelete, apiGet, apiPost } from "./api";

export type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type AddressRow = {
  Addresskey: string;
  Label: string;
  FullName: string;
  Phone: string;
  AddressLine: string;
  Landmark: string | null;
  City: string;
  State: string;
  Pincode: string;
  IsDefault: string | number;
};

const fromRow = (r: AddressRow): Address => ({
  id: r.Addresskey,
  label: r.Label,
  fullName: r.FullName,
  phone: r.Phone,
  addressLine: r.AddressLine,
  landmark: r.Landmark ?? "",
  city: r.City,
  state: r.State,
  pincode: r.Pincode,
  isDefault: Number(r.IsDefault) === 1,
});

export async function fetchAddresses(userKey: string): Promise<Address[]> {
  const rows = await apiGet<AddressRow[]>(`/api/addresses.php?userKey=${userKey}`);
  return rows.map(fromRow);
}

export async function saveAddress(
  userKey: string,
  address: Omit<Address, "id">,
): Promise<Address> {
  const row = await apiPost<AddressRow>("/api/addresses.php", {
    UserKeyRef: userKey,
    Label: address.label,
    FullName: address.fullName,
    Phone: address.phone,
    AddressLine: address.addressLine,
    Landmark: address.landmark,
    City: address.city,
    State: address.state,
    Pincode: address.pincode,
    IsDefault: address.isDefault ? 1 : 0,
  });
  return fromRow(row);
}

export async function deleteAddress(id: string): Promise<void> {
  await apiDelete(`/api/addresses.php?key=${id}`);
}
