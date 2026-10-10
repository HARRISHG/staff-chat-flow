# Patientcurve proposal generator

A browser-only tool for writing a Patientcurve proposal after a discovery call and exporting it as an editable PowerPoint (.pptx).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (formatting, pricing, validation, JSON, slide layout)
npm run build    # production build in dist/
```

There is no backend. Nothing is stored or sent anywhere. Use **Save JSON** and **Open JSON** to keep and reuse proposals.

## How it works

- The form on the left drives a live slide preview on the right. On mobile the form comes first, with a fixed **Generate Proposal PPTX** button.
- `src/slides/build.ts` turns the form into a slide model of positioned text, shapes and lines. The preview (`SlideView.tsx`) and the exporter (`exportPptx.ts`, pptxgenjs) draw that same model, so the preview matches the file.
- Text is measured before layout. If something is too long to fit, the text shrinks to a minimum size; if it still doesn't fit, export is blocked and the form points to the field to shorten.
- The workflow table runs to 4 workflows per slide and continues on extra slides as needed. Unselected workflows never appear, and the Integrations card only appears when integrations are listed.
- Pricing comes only from the form. Tax is added only when amounts exclude tax **and** a rate is entered.
- **Print Proposal** prints one slide per page at 13.33 × 7.5 in.
- **Load Sample Proposal** fills in clearly fictional data and adds a "Sample proposal · do not send" banner to every slide. The banner shows whenever the reference starts with `SAMPLE`.

The deck has 9 slides, plus 1 more for each further group of 4 workflows:

1. Cover
2. Current situation and objectives
3. The Patientcurve approach
4. What is included
5. Workflow details
6. Investment
7. How we get started
8. Support, assumptions and data
9. Acceptance and next step

The brand follows the Patientcurve guidelines: jade and deep colours, a single rose dot, sentence case, ₹ in Indian format and dates like "10 Oct 2026". Arial is the brand's Office fallback font, so the file looks the same on any machine.
