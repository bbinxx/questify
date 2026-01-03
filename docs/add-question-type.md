# Adding New Question Types

This guide explains how to add a new question type to Questify.

## Quick Start (5 Steps)

### 1. Add Type Definition
**File:** `lib/config/question-types.ts`

Add your new type to the `SlideType` union:
```typescript
export type SlideType = 
  | 'single_choice'
  | 'my_new_type'  // ← Add here
  | ...
```

### 2. Add Configuration
**File:** `lib/config/question-types.ts`

Add configuration to `QUESTION_TYPE_CONFIG`:
```typescript
export const QUESTION_TYPE_CONFIG: Record<SlideType, QuestionTypeConfig> = {
  // ... existing types
  
  my_new_type: {
    label: 'My New Type',
    description: 'Description for UI',
    icon: '🎨',
    requiresOptions: false,  // Does it need options array?
    allowsMultipleAnswers: false,  // Can user answer multiple times?
    responseType: 'text',  // 'choice' | 'text' | 'number' | 'scale'
    aggregationType: 'list',  // 'count' | 'list' | 'average' | 'wordcloud'
    
    validateResponse: (response, slide) => {
      // Return true if response is valid
      return typeof response.value === 'string'
    },
    
    processResponse: (response) => {
      // Transform response if needed
      return { value: response.value.trim() }
    }
  }
}
```

### 3. Create Participant Component
**File:** `components/presentations/question-types/MyNewType.tsx`

Create the UI for participants to submit responses:
```typescript
import { useState } from 'react'

interface Props {
  slide: any
  onSubmit: (response: any) => void
  disabled: boolean
}

export function MyNewTypeInput({ slide, onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    onSubmit({ value })
  }

  return (
    <div className="space-y-4">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="w-full p-4 border rounded"
        placeholder="Enter your response..."
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value}
        className="px-6 py-2 bg-blue-600 text-white rounded"
      >
        Submit
      </button>
    </div>
  )
}
```

### 4. Create Results Component
**File:** `components/presentations/question-types/MyNewTypeResults.tsx`

Create the UI for displaying results:
```typescript
interface Props {
  votesData: any[]
  textResponses?: any[]
}

export function MyNewTypeResults({ votesData, textResponses }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Results</h3>
      <div className="grid gap-2">
        {textResponses?.map((response, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded">
            <p className="font-semibold">{response.userName}</p>
            <p>{response.response.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5. Register Components
**File:** `app/p/[code]/page.tsx` (participant view)

Add your component to the render switch:
```typescript
import { MyNewTypeInput } from '@/components/presentations/question-types/MyNewType'

// In the render section:
{slide.type === 'my_new_type' ? (
  <MyNewTypeInput
    slide={slide}
    onSubmit={value => submitResponse(value)}
    disabled={busy}
  />
) : ...}
```

**File:** `components/presentations/result-chart.tsx` (presenter view)

Add your results component:
```typescript
import { MyNewTypeResults } from './question-types/MyNewTypeResults'

// In the render section:
if (slide.type === 'my_new_type') {
  return <MyNewTypeResults votesData={votesData} textResponses={textResponses} />
}
```

## That's It!

The socket server will automatically:
- ✅ Handle response validation
- ✅ Process and store responses
- ✅ Broadcast updates to presenter
- ✅ Track response counts
- ✅ Aggregate data per slide

## Configuration Options Explained

### `requiresOptions: boolean`
- `true`: Question needs an options array (e.g., multiple choice)
- `false`: Question doesn't need options (e.g., open text)

### `allowsMultipleAnswers: boolean`
- `true`: User can submit multiple times (e.g., Q&A)
- `false`: User can only submit once (e.g., poll)

### `responseType`
- `'choice'`: Select from predefined options
- `'text'`: Free text input
- `'number'`: Numeric input
- `'scale'`: Rating/scale (1-5, etc.)

### `aggregationType`
- `'count'`: Count occurrences (for voting)
- `'list'`: Show all responses as list
- `'average'`: Calculate average (for numbers)
- `'wordcloud'`: Aggregate words with frequency

## Advanced: Custom Processing

### Validation
```typescript
validateResponse: (response, slide) => {
  // Check if response meets requirements
  if (slide.type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response.value)
  }
  return true
}
```

### Processing
```typescript
processResponse: (response, slide) => {
  // Transform response before storing
  return {
    value: response.value.toLowerCase(),
    timestamp: Date.now(),
    metadata: { /* custom data */ }
  }
}
```

## Example: Adding "Rating Stars" Type

```typescript
// 1. Add to SlideType
| 'rating_stars'

// 2. Configure
rating_stars: {
  label: 'Star Rating',
  description: 'Rate with 1-5 stars',
  icon: '⭐',
  requiresOptions: false,
  allowsMultipleAnswers: false,
  responseType: 'number',
  aggregationType: 'average',
  validateResponse: (response) => {
    return response.value >= 1 && response.value <= 5
  },
  processResponse: (response) => ({
    value: Math.round(response.value)
  })
}

// 3. Create RatingStarsInput.tsx (5 star buttons)
// 4. Create RatingStarsResults.tsx (show average + distribution)
// 5. Register in participant and presenter views

// Done! ✨
```

## Need Help?

Check existing question types in:
- `lib/config/question-types.ts` - Configuration
- `components/presentations/question-types/` - Component examples
- `server/socket-server.ts` - Socket handling (automatic)
