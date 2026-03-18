# Gene Variant Explorer

Gene Variant Explorer is a web-based platform built with Next.js and TypeScript for exploring gene-level and variant-level genomic data.

The application is currently optimized for the **FGFR3** gene, integrating both public ClinVar data and internally curated custom datasets. While FGFR3 is the primary supported gene at this stage, the architecture is designed to support additional genes in the future with minimal modification.

---

## Project Overview

Gene Variant Explorer enables users to:

* Search for a gene (currently FGFR3 fully supported)
* View all variants associated with that gene
* Explore variant-level details across multiple biological and clinical dimensions
* Compare public ClinVar data with internally curated custom data
* Visualize variant-related metrics using interactive charts

The system is modular and scalable, allowing future expansion to additional genes and datasets.

---

## Technology Stack

### Framework

* **Next.js (App Router)**
* Server and Client Components architecture
* Dynamic routing for gene and variant-level pages

### Language

* **TypeScript**

### Styling

* **Tailwind CSS**

### Data Visualization

* Plotly (via react-plotly.js)
* Custom reusable chart components

### Data Sources

* ClinVar API (public variant data)
* Custom uploaded datasets (currently FGFR3 only)

---

## Application Structure

```
.
├── public
├── src
│   ├── app
│   │   ├── favicon.ico
│   │   ├── gene
│   │   │   └── [symbol]
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── variant
│   │       └── [id]
│   ├── components
│   │   ├── charts
│   │   ├── filters
│   │   ├── layout
│   │   ├── tables
│   │   └── variant
│   │       └── tabs
│   └── lib
└── tsconfig.json
```

### Key Directories

#### `app/`

Contains route-level components using Next.js App Router.

* `page.tsx` – Landing page (gene search)
* `gene/[symbol]/` – Gene dashboard
* `variant/[id]/` – Variant-level detail page
* `layout.tsx` – Global layout configuration

#### `components/`

Reusable UI components organized by domain:

* `charts/` – Plot components (population plots, lollipop plots, etc.)
* `filters/` – Table and dashboard filtering components
* `layout/` – Navigation and structural layout components
* `tables/` – ClinVar and Custom variant tables
* `variant/tabs/` – Variant-level tab components

#### `lib/`

Utility functions, static data, dummy data, and shared logic.

---

## Core Features

### 1. Landing Page

Users can enter a gene symbol.

* Currently, **FGFR3** is fully supported.
* ClinVar data can be fetched for any gene symbol supported by the ClinVar API.
* Custom data is available only for FGFR3.

---

### 2. Gene Dashboard

Route: `/gene/[symbol]`

Displays:

* All variants for the selected gene
* Two data tables:

  * **ClinVar Variants**

    * Fetched dynamically from the ClinVar API
  * **Custom Variants**

    * Uploaded and stored locally (FGFR3 only)

Additional features:

* Plot section summarizing gene-level metrics
* Filtering and sorting capabilities
* Clickable rows for variant-level exploration

---

### 3. Variant Detail Page

Route: `/variant/[id]`

Each variant page contains multiple tabs providing structured biological and clinical insights:

#### Overview

General summary of the variant, identifiers, and key annotations with ACMG classification scale.

#### Clinical

ClinVar classifications, clinical significance, and disease associations.

#### Functional

Experimental functional evidence and assay-based insights.

#### Annotation

Predictive annotations such as REVEL and other computational scores.

#### Population

Allele frequency data from gnomAD (global and population-specific where available).

#### Associations

Association results such as trait or phenotype correlations.

Each tab is modular and implemented as an independent component, allowing future expansion without affecting other sections.

---

## Data Handling

### ClinVar Data

* Fetched dynamically via ClinVar API
* Used for public germline classification and condition mapping

### Custom Data

* Uploaded internally
* Currently available only for FGFR3
* Includes:

  * Functional assay results
  * REVEL scores
  * Association metrics
  * Population statistics

### Matching Strategy

Variants are matched across datasets using:

* Genomic coordinates
* cDNA change
* Protein change
* Normalized identifiers where required

---

## Scalability

Although FGFR3 is the primary supported gene:

* The routing structure supports any gene symbol
* ClinVar integration works generically
* Custom data architecture is extensible for additional genes
* Modular component structure enables easy expansion

Future enhancements may include:

* Multi-gene custom dataset support
* Additional annotation sources
* Structural visualization
* Biobank integrations
* Advanced filtering and cross-gene comparisons

---

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build Production

```bash
npm run build
```

---
## Running with Docker

This project includes a `Dockerfile` and `docker-compose.yml` for containerized deployment.

### Prerequisites

* Docker installed
* Docker Compose installed (or Docker with Compose plugin)

### Build the Application

```bash
docker compose build
```

### Start the Application

```bash
docker compose up -d
```

This will:

* Build the Docker image
* Start the application in detached mode
* Expose the configured port (as defined in `docker-compose.yml`)

### Stop the Application

```bash
docker compose down
```

After starting the container, open your browser and navigate to the configured host and port (commonly `http://localhost:3000` unless changed in the compose file).

---


## Design Philosophy

* Modular architecture
* Strict TypeScript typing
* Clean separation of:

  * Data logic
  * UI components
  * Visualization components
* Scalable folder structure
* Research-focused UI/UX design

---

## Current Limitations

* Custom dataset available only for FGFR3
* Some features depend on availability of external API data
* Population visualization depends on available frequency data

---

## Future Roadmap

* Add support for additional genes
* Improve population distribution visualizations
* Add structural protein views
* Integrate literature APIs
* Expand functional evidence datasets

---

## License

Specify license here.

---

This project serves as a structured, scalable foundation for gene and variant-level genomic exploration in a research-oriented environment.
