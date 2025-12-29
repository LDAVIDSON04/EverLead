# How to Export Images from Figma

The Figma export includes code references to images, but the actual image files need to be exported separately. Here's how to get all the images:

## Method 1: Export Individual Images from Figma

1. Open the Figma file: `Soradin Provider Page Design`
2. For each image below, select it in Figma and export:

### CaseStudiesSection Images (3 images):
- Select the illustration in the "Reach the right patients" card → Export as PNG → Name it: `391d87d0bfa941287dde563e9d115601074bffda.png`
- Select the illustration in the "Turn availability into confirmed appointments" card → Export as PNG → Name it: `aa944d0f69729d63dff1b4adab6f298d6b22262e.png`
- Select the illustration in the "Make in-person care easier to access" card → Export as PNG → Name it: `a478ea6f5e58a07a66b407d76c672137532df177.png`

### SolutionsSection Images (2 images):
- Select the mockup in the "Soradin Marketplace" card → Export as PNG → Name it: `cd6b39dd37848fa2e07c2d2e725d3e2c50d49696.png`
- Select the mockup in the "Website scheduling" card → Export as PNG → Name it: `f103b18d805714f0cf26707650407e7192408cbe.png`

### IntegrationSection Image (1 image):
- Select the integration diagram (the one with Soradin in the center connected to other services) → Export as PNG → Name it: `6b0593cc835f18d9641d254dbc73276db55cd173.png`

### CTASection Image (1 image):
- Select the scattered profile cards illustration → Export as PNG → Name it: `1287f77558fc6a47c506a92275bdcb435d5dc5d5.png`

## Method 2: Bulk Export from Figma

1. In Figma, select all the image elements you need
2. Use Figma's "Export" panel to export all selected items
3. Make sure to name them with the exact filenames listed above

## After Exporting:

1. Place all 7 exported PNG files in the `public/` folder of your project
2. The components will automatically use them once they're in place

## Current Status:

✅ Profile images (4) - Already in `public/` folder:
- `56636ec270d99f4a4d6ae68e014f42a3fc84e7c3.png` (William White)
- `6cf5ec63f87cc57ba7775f9fb59e1fd68aa5998b.png` (Michael Davis)
- `a16d084325d7eb62b3170f963475f05b750a383d.png` (David Chen)
- `ca3d03ea2df40f93620bf476ca4d13a99c120a0d.png` (James Miller)

❌ Missing images (7) - Need to be exported from Figma:
- CaseStudiesSection: 3 images
- SolutionsSection: 2 images  
- IntegrationSection: 1 image
- CTASection: 1 image

