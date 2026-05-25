# Address Management API

Base URL: `/api/address`

All endpoints require JWT authentication:

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Rules

- Each address belongs to the logged-in user from `req.user`.
- A user can save a maximum of 3 addresses.
- The first address is automatically marked as default.
- Only one address can be default per user.
- Users can only read, update, delete, or set default for their own addresses.
- The MongoDB collection name is `addressmasters`.

## Add Address

`POST /api/address`

```json
{
  "fullName": "Rahul Yadav",
  "mobileNumber": "9876543210",
  "alternateMobileNumber": "9123456780",
  "addressLine1": "Flat 301, Pearl Residency",
  "addressLine2": "Road No. 12",
  "landmark": "Near City Mall",
  "city": "Hyderabad",
  "state": "Telangana",
  "country": "India",
  "postalCode": "500081",
  "addressType": "Home",
  "isDefault": true
}
```

Success response:

```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "_id": "663f0f0f0f0f0f0f0f0f0f0f",
    "userId": "663f0e0e0e0e0e0e0e0e0e0e",
    "fullName": "Rahul Yadav",
    "mobileNumber": "9876543210",
    "city": "Hyderabad",
    "state": "Telangana",
    "postalCode": "500081",
    "addressType": "Home",
    "isDefault": true,
    "createdAt": "2026-05-13T15:45:00.000Z",
    "updatedAt": "2026-05-13T15:45:00.000Z"
  }
}
```

Max address response:

```json
{
  "success": false,
  "message": "Maximum 3 addresses are allowed per user"
}
```

## Get Addresses

`GET /api/address?page=1&limit=10&city=Hyderabad&state=Telangana`

Search city or state with:

`GET /api/address?search=Hyderabad`

Success response:

```json
{
  "success": true,
  "message": "Addresses fetched successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

## Get Single Address

`GET /api/address/:id`

Not found or non-owned address response:

```json
{
  "success": false,
  "message": "Address not found"
}
```

## Update Address

`PUT /api/address/:id`

```json
{
  "addressLine1": "Villa 12, Lake View Enclave",
  "city": "Secunderabad",
  "state": "Telangana",
  "postalCode": "500003",
  "addressType": "Office"
}
```

To make the address default while updating:

```json
{
  "isDefault": true
}
```

## Delete Address

`DELETE /api/address/:id`

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

If the deleted address was default, the most recently updated remaining address becomes default.

## Set Default Address

`PATCH /api/address/:id/default`

```json
{
  "success": true,
  "message": "Default address updated successfully",
  "data": {
    "_id": "663f0f0f0f0f0f0f0f0f0f0f",
    "isDefault": true
  }
}
```

## Indexes

The `Address` model creates these indexes:

```js
addressSchema.index(
  { userId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
    name: 'unique_default_address_per_user',
  }
);
addressSchema.index({ userId: 1, city: 1, state: 1 });
addressSchema.index({ userId: 1, createdAt: -1 });
```
