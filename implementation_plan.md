# Implementation Plan - Fleet Compliance Improvements

The user wants to add a `provider` field to bus documents and optimize the UI for both the "Bus Documents Vault" and the "Reminders" page.

## User Review Required

> [!IMPORTANT]
> **Bus Documents Vault (`BusDocuments.jsx`)**: I will refactor the current single-bus matrix view into a standard vertical list of documents, including a new "Provider" column.
> **Reminders Section (`Reminders.jsx`)**: I will MAINTAIN the matrix view (all buses vs all types) as requested, but I will ensure the `expiry_date` and `provider` information are integrated into the cells.

## Proposed Changes

### Database & Backend

#### [MODIFY] [documentModel.js](file:///c:/Users/Mahadev/Desktop/TraccoBusManagement/src/models/documentModel.js)
- Update `getBusDocuments` to select the `provider` column.
- Update `createBusDocument` to include `provider` in the `INSERT` statement.
- Update `getExpiringDocumentsInfo` to select the `provider` column and more metadata.

#### [MODIFY] [documentController.js](file:///c:/Users/Mahadev/Desktop/TraccoBusManagement/src/controllers/documentController.js)
- Update `uploadBusDocumentController` to extract `provider` from the request body and pass it to the model.

### Frontend - Bus Documents Vault

#### [MODIFY] [BusDocuments.jsx](file:///c:/Users/Mahadev/Desktop/TraccoBusManagement/src/pages/Buses/Modules/BusDocuments.jsx)
- **State**: Add `provider` to the `formData`.
- **Form**: Add an input field for "Provider Name".
- **List (Table)**: 
    - Refactor the table from a matrix to a vertical list of documents.
    - Columns: `Document Type`, `Provider Name`, `Start Date`, `Expiry Date`, `Status`, `Download (PDF)`.

### Frontend - Reminders Section

#### [MODIFY] [Reminders.jsx](file:///c:/Users/Mahadev/Desktop/TraccoBusManagement/src/pages/Reminders.jsx)
- Update `fetchData` to store the `provider` alongside `expiry_date` in the grouped reminders object.
- **UI**: Keep the matrix form (All Buses vs All Types).
- **Cells**: Display the `expiry_date` and document status. Include the `provider` name (if available) within the cell for better context.

## Verification Plan

### Automated Tests
- Manual API testing via [fetch](file:///c:/Users/Mahadev/Desktop/TraccoBusManagement/src/pages/Buses/Modules/BusReadings.jsx#24-59) in browser console for stock increments/decrements.

### Manual Verification
1. Open **Stocks** -> Add a purchase (e.g., 10 Filters) -> Check if stock counts 10.
2. Open **Bus Details** -> **Spare Parts** -> Register replacement (e.g., 2 Filters) -> Check if stock drops to 8.
