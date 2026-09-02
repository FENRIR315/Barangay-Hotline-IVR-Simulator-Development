import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";

interface ComingSoonProps {
  title: string;
  description: string;
  items?: string[];
}

export function ComingSoon({ title, description, items = [] }: ComingSoonProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm font-medium text-gray-700">Coming in a later phase</p>
          {items.length > 0 && (
            <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left text-xs text-gray-500">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}