"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";

export default function TestFitnessPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDirectAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fitness/test-direct');
      const data = await response.json();
      setResult({
        status: response.status,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testOriginalAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fitness/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
      });
      const data = await response.json();
      setResult({
        status: response.status,
        data: data,
        timestamp: new Date().toISOString(),
        type: 'original-api'
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'original-api'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Google Fitness API Test</h1>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={testDirectAPI}
              isLoading={loading}
              color="primary"
            >
              Test Direct API (HTML Style)
            </Button>
            <Button
              onClick={testOriginalAPI}
              isLoading={loading}
              color="secondary"
            >
              Test Original API
            </Button>
          </div>

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Test Result - {result.timestamp}
                  {result.type && ` (${result.type})`}
                </h3>
              </CardHeader>
              <CardBody>
                <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardBody>
            </Card>
          )}

          <div className="text-sm text-gray-600 mt-4">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Make sure you're logged in to the app</li>
              <li>Ensure Google Fitness is connected</li>
              <li>Click "Test Direct API" to test the HTML-style implementation</li>
              <li>Click "Test Original API" to test the FIXED implementation using direct fetch</li>
              <li>Both should now work and return your step data!</li>
            </ul>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">
                <strong>🎉 FIXED!</strong> I've updated the Google Fitness service to use the working direct fetch approach.
                The "Test Original API" should now successfully retrieve your step data just like the direct API test.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}