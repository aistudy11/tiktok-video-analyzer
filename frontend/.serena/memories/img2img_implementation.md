# Image-to-Image (img2img) Implementation Details

## Overview
The shipany2 project implements a comprehensive image generation system supporting both Text-to-Image and Image-to-Image modes using a unified interface.

## Key Components

### 1. Main Component: ImageGenerator (`src/shared/blocks/generator/image.tsx`)
**Location**: `/Users/a11/MyCode/shipany2/src/shared/blocks/generator/image.tsx`

**Key Features**:
- Tab-based UI switching between "text-to-image" and "image-to-image"
- Multi-provider support (Replicate, Gemini)
- Multi-model support with provider and scene filtering
- Credit cost system (2 credits for text-to-image, 4 credits for image-to-image)
- Real-time progress tracking (5-second polling interval)
- 3-minute generation timeout

**State Management**:
- `activeTab`: Current mode (text-to-image or image-to-image)
- `referenceImageItems`: Uploaded reference images with status tracking
- `referenceImageUrls`: URLs of uploaded reference images
- `generatedImages`: Array of generated image results
- `isGenerating`: Generation in-progress flag
- `progress`: Generation progress percentage (0-100)
- `taskId`: Current task ID for polling
- `taskStatus`: Current task status (PENDING, PROCESSING, SUCCESS, FAILED)
- `downloadingImageId`: Track which image is being downloaded

### 2. Image Uploader (`src/shared/blocks/common/image-uploader.tsx`)
**Purpose**: Handle reference image uploads for img2img mode

**Features**:
- Drag-and-drop capable
- Multiple image support (configurable)
- File size validation (default 5MB per image, configurable)
- Parallel upload handling
- Status tracking: idle → uploading → uploaded or error
- Blob URL cleanup to prevent memory leaks
- Visual feedback: uploading overlay, error state

**Upload Process**:
1. User selects image(s)
2. Create blob URLs for preview
3. Mark items as "uploading"
4. POST to `/api/storage/upload-image`
5. Get URL from response
6. Update item status to "uploaded"
7. Emit onChange with updated items

### 3. API Route: Generate (`src/app/api/ai/generate/route.ts`)
**Endpoint**: `POST /api/ai/generate`

**Responsibilities**:
- Validate provider, model, mediaType
- Check user authentication
- Calculate credit costs based on scene (text-to-image=2, image-to-image=4)
- Verify sufficient user credits
- Build request options with reference image URLs
- Call AI provider's generate method
- Create AI task record in database
- Return task data to client

**Request Payload**:
```typescript
{
  provider: string;           // 'replicate' | 'gemini'
  mediaType: AIMediaType;     // 'image'
  model: string;              // model identifier
  prompt: string;             // text prompt
  scene: string;              // 'text-to-image' | 'image-to-image'
  options: {
    image_input?: string[];   // Array of image URLs for img2img
    [key: string]: any;       // Other provider-specific options
  };
}
```

### 4. API Route: Query (`src/app/api/ai/query/route.ts`)
**Endpoint**: `POST /api/ai/query`

**Responsibilities**:
- Poll task status from provider
- Update task status in database
- Parse and format results
- Return current task status to client

**Polling Strategy**:
- 5-second interval (POLL_INTERVAL constant)
- 3-minute timeout (GENERATION_TIMEOUT constant)
- Timeout error handling with toast notification
- Automatic progress updates

### 5. Providers

#### Replicate Provider (`src/extensions/ai/replicate.ts`)
- **Generate Method**:
  - Accepts prompt + options (including image_input for img2img)
  - Merges options with prompt into single input object
  - Creates prediction via Replicate API
  - Returns PENDING status with task ID

- **Query Method**:
  - Polls prediction status via Replicate API
  - Extracts images from output (handles array/string formats)
  - Maps Replicate status to internal status enum
  - Returns images in AIImage format

- **Supported Models**:
  - `black-forest-labs/flux-schnell` (text-to-image only)
  - `google/nano-banana` (both modes)
  - `bytedance/seedream-4` (both modes)

#### Gemini Provider (`src/extensions/ai/gemini.ts`)
- **Generate Method**:
  - Converts image URLs to base64 for API request
  - Builds multipart request with prompt + images
  - Makes synchronous request to Gemini API
  - Extracts image from response (inlineData)
  - Uploads generated image to storage
  - Returns SUCCESS status (synchronous response)

- **Query Method**:
  - Not implemented (sync only)

- **Supported Models**:
  - `gemini-3-pro-image-preview` (both modes)

### 6. Model Configuration
Located in ImageGenerator component:
```typescript
MODEL_OPTIONS = [
  {
    value: 'black-forest-labs/flux-schnell',
    label: 'FLUX Schnell',
    provider: 'replicate',
    scenes: ['text-to-image'],
  },
  {
    value: 'google/nano-banana',
    label: 'Nano Banana',
    provider: 'replicate',
    scenes: ['text-to-image', 'image-to-image'],
  },
  {
    value: 'bytedance/seedream-4',
    label: 'Seedream 4',
    provider: 'replicate',
    scenes: ['text-to-image', 'image-to-image'],
  },
  {
    value: 'gemini-3-pro-image-preview',
    label: 'Gemini 3 Pro Image Preview',
    provider: 'gemini',
    scenes: ['text-to-image', 'image-to-image'],
  },
];
```

## Data Flow

### Image-to-Image Generation Flow:
1. **Upload Phase**:
   - User selects reference images in ImageUploader
   - Images uploaded to storage via `/api/storage/upload-image`
   - URLs stored in `referenceImageUrls` state

2. **Generation Phase**:
   - User enters prompt and clicks generate
   - POST to `/api/ai/generate` with scene='image-to-image'
   - Backend creates AI task, returns task ID
   - Client stores taskId and begins polling

3. **Polling Phase**:
   - Every 5 seconds, POST to `/api/ai/query` with taskId
   - Provider queries actual task status
   - Update local progress percentage
   - Display status label based on AITaskStatus

4. **Completion**:
   - Provider returns SUCCESS status with images
   - Extract image URLs from response
   - Display in generated images section
   - Credit deduction happens on initial generation

## Key Technical Patterns

### Provider Abstraction
All AI providers implement the AIProvider interface:
```typescript
interface AIProvider {
  readonly name: string;
  configs: AIConfigs;
  generate(params: AIGenerateParams): Promise<AITaskResult>;
  query?(taskId: string): Promise<AITaskResult>;
}
```

### Task Status Mapping
Internal status enum: PENDING → PROCESSING → SUCCESS or FAILED

### Image URL Extraction
Flexible extraction handles multiple response formats:
- `result.output` (array or string)
- `result.images` (array)
- `result.data` (array)
- Nested object properties: url, uri, image, src, imageUrl

### Credit System
- Text-to-Image: 2 credits
- Image-to-Image: 4 credits
- Validation happens before task creation
- Credits deducted on initial API call

## UI Features

1. **Tab Navigation**: Easy switching between modes with model filtering
2. **Provider/Model Selection**: Cascading dropdowns
3. **Reference Image Upload**: Visual grid with upload state
4. **Prompt Input**: 2000 character limit with counter
5. **Progress Visualization**: Percentage bar with status label
6. **Generated Images Display**: Responsive grid (1 or 2 columns)
7. **Download Button**: Direct image download support
8. **Credit Display**: Shows cost and remaining credits
9. **Sign-in Prompt**: For unauthenticated users

## Database Models

### AITask
Stores generation request/result:
- `id`: Task identifier
- `userId`: Owner user
- `mediaType`: 'image', 'music', etc.
- `provider`: 'replicate', 'gemini'
- `model`: Model identifier string
- `prompt`: User's text prompt
- `scene`: 'text-to-image' or 'image-to-image'
- `options`: JSON string of custom options
- `status`: Current task status
- `costCredits`: Credits consumed
- `taskId`: Provider's task ID
- `taskInfo`: JSON from provider query
- `taskResult`: Raw provider response
