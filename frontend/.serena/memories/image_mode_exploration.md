# Image Mode (图生图模式) Implementation Exploration

## Overview
The poster-v2 project has a partial Image Mode (img2img) implementation where users can upload images and provide descriptions to transform them. This is separate from the text-to-image generation flow.

## Key Files & Components

### 1. UI Component (Step1InputContent.tsx)
**Location**: `/Users/a11/MyCode/poster-v2/src/components/generator-v3/steps/Step1InputContent.tsx`

**Key Features**:
- Tabs interface switching between 'text' mode and 'image' mode
- Tab triggers at lines 929-939:
  - "Direct Mode" (text): Uses Type icon + t('direct_mode')
  - "Template Mode" (image): Uses ImageIcon + t('template_mode')

**Image Mode UI (lines 1140-1185)**:
```tsx
<TabsContent value="image" className="space-y-4 mt-6">
  {/* Image Upload Area */}
  <div className="border-2 border-dashed border-white/20 rounded-lg p-8">
    <ImageIcon className="w-12 h-12 mx-auto text-white/40 mb-4" />
    <p className="text-white/80 mb-2">{t('upload_image')}</p>
    <p className="text-sm text-white/60">{t('drag_drop_hint')}</p>
    <input
      type="file"
      accept="image/*"
      className="hidden"
      id="image-upload"
      disabled={disabled}
    />
    <Button
      variant="outline"
      className="mt-4"
      onClick={() => document.getElementById('image-upload')?.click()}
      disabled={disabled}
    >
      {t('select_file')}
    </Button>
  </div>

  {/* Image Description Area */}
  <div>
    <label className="block text-sm font-medium text-white/80 mb-2">
      {t('image_transform_desc')}
    </label>
    <Textarea
      value={imageDescription}
      onChange={(e) => {
        setImageDescription(e.target.value);
        onContentChange({
          mode: 'image',
          imageUrl,
          imageDescription: e.target.value,
          aiOptimized: aiEnabled,
          status: 'editing'
        });
      }}
      placeholder={t('image_desc_placeholder')}
      className="min-h-[80px]"
      disabled={disabled}
    />
  </div>
</TabsContent>
```

**Input Content State Structure (lines 40-55)**:
```tsx
interface InputContent {
  mode: 'text' | 'image';           // Mode selector
  text?: string;                     // Text prompt
  imageUrl?: string;                 // Uploaded image URL
  imageDescription?: string;         // Description/instructions
  aiOptimized: boolean;
  optimizedText?: string;
  classification?: ClassificationSnapshot | null;
  userModified?: boolean;
  sessionId?: string | null;
  quality?: QualitySnapshot | null;
  extensions?: Extensions | null;
  creative?: EightFieldJSON | null;
  status: ContentStatus;
  confirmedText?: string;
}
```

**Mode Change Handler (lines 897-910)**:
- Triggered when user switches tabs
- Updates content with appropriate fields based on mode
- Clears optimization state when switching modes

### 2. Generator Main Component
**Location**: `/Users/a11/MyCode/poster-v2/src/components/generator-v3/index.tsx`

**Content Validation (lines 186-188, 237-239)**:
```tsx
const hasValidContent =
  (content.mode === 'text' && content.text?.trim()) ||
  (content.mode === 'image' && (content.imageUrl || content.imageDescription));
```

**Generation Trigger Logic**:
- Both text and image modes support generation
- Either image URL or image description can trigger generation (line 239)

### 3. Gallery Context (State Management)
**Location**: `/Users/a11/MyCode/poster-v2/src/contexts/gallery.tsx`

**PosterRequestBody Interface (lines 70-96)**:
```tsx
interface PosterRequestBody {
  prompt?: string;
  sessionId?: string | null;
  mode?: 'preview' | 'confirm' | 'generate' | 'cancel';
  styleSelections?: { primary?: string; secondary?: string[] };
  confirmedPrompt?: string;
  providerSettings?: {
    provider: string;
    aspectRatio: string;
    quality: string;
    generationMode: string;    // ✅ Supports 'text2img' and 'img2img'
  };
  // ... other fields
}
```

### 4. API Handler (Poster Route)
**Location**: `/Users/a11/MyCode/poster-v2/src/app/api/poster/route.ts`

**ProviderSettings Schema (lines 32-41)**:
```tsx
const ProviderSettingsSchema = z.object({
  provider: z.string().optional(),
  aspectRatio: z.enum(['2:3', '1:1', '9:16', '16:9', '3:2']).optional(),
  quality: z.enum(['draft', 'standard', 'high']).optional(),
  generationMode: z.enum(['text2img', 'img2img']).optional(),  // ✅ img2img supported
  inputImageUrl: z.string().url().optional(),                  // ✅ Image URL field
  editInstructions: z.string().optional()                       // ✅ Edit instructions
});
```

**Request Schema (lines 48-74)**:
```tsx
const PosterRequestSchema = z.object({
  mode: z.enum(['preview', 'confirm', 'generate', 'regenerate', 'cancel']),
  sessionId: z.string().uuid().optional(),
  prompt: z.string().min(1).max(2000).optional(),
  confirmedPrompt: z.string().min(1).max(2000).optional(),
  styleSelections: StyleSelectionsSchema,
  providerSettings: ProviderSettingsSchema.optional(),
  // ... other fields
});
```

**API Modes (line 49)**:
- `preview`: Preview/optimize prompt before generation
- `confirm`: Confirm and prepare for generation
- `generate`: Execute generation
- `regenerate`: Regenerate with same params
- `cancel`: Cancel task

## Data Flow

### 1. User Upload Flow
```
User Input (image + description)
    ↓
Step1InputContent onChange
    ↓
onContentChange({ mode: 'image', imageUrl, imageDescription })
    ↓
GeneratorV3 updatesinputContent state
    ↓
canGenerate computed (image has URL or description)
    ↓
Validation checks (hasValidContent)
    ↓
Generate button enabled
```

### 2. Generation Flow
```
generatePoster() called
    ↓
API POST /api/poster
    ↓
mode: 'preview' / 'confirm' / 'generate'
    ↓
providerSettings: {
      generationMode: 'img2img',
      inputImageUrl: imageUrl,
      editInstructions: imageDescription
    }
    ↓
Pipeline execution (text2img or img2img)
    ↓
AI Provider (APImart, APICore, etc.)
    ↓
Generated image returned
```

## Current Implementation Status

### ✅ Completed
1. **UI Components**: Image upload area with file input
2. **State Management**: InputContent interface with image fields
3. **Input Validation**: Image mode content validation
4. **API Schema**: img2img generationMode and image fields defined
5. **Mode Switching**: Tab-based mode switching between text and image

### ⚠️ Incomplete/TODO
1. **Image Upload Handler**: No file input onChange handler visible
   - File selection not connected to imageUrl state
   - No image upload to R2 storage
   - No image preview display

2. **Drag & Drop**: Not implemented
   - Mentioned in i18n text (`drag_drop_hint`)
   - No onDrop/onDragOver handlers

3. **Image Preview**: No preview display after upload

4. **API Integration**: generatePoster() call needs:
   - generationMode: 'img2img'
   - inputImageUrl: from uploaded image
   - editInstructions: from description

5. **Error Handling**: No error states for:
   - Failed image upload
   - Unsupported image format
   - File size limits

## i18n Translation Keys
- `upload_image`: "Upload your image"
- `drag_drop_hint`: "Drag and drop or click to select"
- `select_file`: "Select File"
- `image_transform_desc`: "Describe how you want to transform the image"
- `image_desc_placeholder`: Placeholder text for description

## Key Types

### ClassificationSnapshot
- From: `@/services/poster-generation/types`
- Used for style/category classification

### QualitySnapshot
- From: `@/services/poster-generation/types`
- Used for quality settings

### EightFieldJSON
- From: `@/types/creative`
- Unified creative data structure with 12 fields

### Extensions
- From: `@/lib/poster/types`
- Provider-specific extensions

## Related Files to Check
- `/Users/a11/MyCode/poster-v2/src/app/api/storage/upload-image/route.ts` - Image upload API
- `/Users/a11/MyCode/poster-v2/src/lib/r2-storage.ts` - R2 storage integration
- `/Users/a11/MyCode/poster-v2/src/services/poster-generation/pipeline.ts` - Generation pipeline
- `/Users/a11/MyCode/poster-v2/src/lib/poster/providers/` - Provider implementations
- Translations in `/Users/a11/MyCode/poster-v2/src/i18n/` for complete i18n keys

## Notes
- Image mode shares same generation pipeline as text mode
- Both modes support AI optimization (though less clear for images)
- Style selection applies to both modes
- Creative fields work with both text and image inputs
- Provider settings determine actual generation mode (text2img vs img2img)
