# Travel Spend & Onboarding Intelligence Dashboard

A modern, responsive travel spend and onboarding intelligence dashboard built with React, TypeScript, Tailwind CSS, and Recharts, migrated from Streamlit.

## Features

- **Security Gate**: Password protection (`admin123`) matching original authentication flow.
- **Filter Views**: Interactive multi-select filters for Status (`Onboarded`, `Unmanaged`) and Org Type (`Enterprise`, `SME`, `Startup`).
- **Spend Metrics (KPIs)**:
  - Total Spend (₹)
  - Active Organizations count
  - Unmanaged Spend exposure
- **Interactive Visualizations**:
  - Spend by Status (Donut / Pie Chart) with color mapping
  - Top Unmanaged Spend (Horizontal Bar Chart)
- **Itinerary Table**:
  - Searchable and sortable columns (Organisation Name, Month, Spend, Status, Org Type)
  - Status badges
  - CSV export
- **Data Tools**:
  - Excel (.xlsx, .xls) and CSV file drag-and-drop / manual upload
  - Generate randomized testing datasets (100 rows)
  - Reset to original dataset

## Running the App

```bash
npm run dev
```

The application runs on port `3000` (`http://0.0.0.0:3000`).
