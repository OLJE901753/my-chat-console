import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const Content: React.FC = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          Content planning and exports coming soon.
        </CardContent>
      </Card>
    </div>
  )
}

export default Content


