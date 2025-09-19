import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const Drones: React.FC = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Drones</CardTitle>
        </CardHeader>
        <CardContent>
          Drone management coming soon.
        </CardContent>
      </Card>
    </div>
  )
}

export default Drones


