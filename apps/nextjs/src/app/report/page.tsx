import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui";

import { getSession } from "~/auth/server";

export default async function ReportPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="container py-8">
        <p>Please sign in to access the report feature.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Report Allergy Reaction</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Help the Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Share your allergy experience to help others with similar
                allergies make informed choices.
              </p>

              <div className="space-y-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h3 className="mb-2 font-medium">📱 Coming Soon</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Product search and selection</li>
                      <li>• Allergy symptom reporting</li>
                      <li>• Severity rating</li>
                      <li>• Anonymous reporting options</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/10">
                  <CardContent className="p-4">
                    <h3 className="mb-2 font-medium text-primary">
                      🛡️ Privacy First
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your reports will be anonymized and used only to help
                      others avoid potential allergens.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
