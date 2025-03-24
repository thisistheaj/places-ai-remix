import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Copy } from "lucide-react";
import { useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import "prismjs/themes/prism-tomorrow.css";

export async function loader() {
  return json({
    baseUrl: process.env.API_BASE_URL || "https://your-api-domain.com",
  });
}

function CodeBlock({ 
  children, 
  className = "", 
  language = "bash" 
}: { 
  children: string; 
  className?: string;
  language?: "bash" | "typescript" | "python" | "json";
}) {
  useEffect(() => {
    Prism.highlightAll();
  }, [children]);

  return (
    <div className="group relative">
      <pre className={`rounded-lg bg-[#14141f] p-6 ${className}`}>
        <code className={`block font-mono text-lg leading-relaxed language-${language}`}>
          {children}
        </code>
      </pre>
      <button 
        onClick={() => navigator.clipboard.writeText(children)}
        className="absolute right-4 top-4 rounded-md p-2 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
      >
        <Copy className="h-4 w-4 text-white/70" />
      </button>
    </div>
  );
}

function MethodPill({ method }: { method: 'GET' | 'POST' | 'DELETE' }) {
  const colors = {
    GET: 'bg-slate-600 text-slate-100',
    POST: 'bg-emerald-600 text-emerald-100',
    DELETE: 'bg-rose-600 text-rose-100'
  };

  return (
    <span className={`rounded-md px-3 py-1 text-sm font-semibold ${colors[method]}`}>
      {method}
    </span>
  );
}

export default function DocsIndex() {
  const { baseUrl } = useLoaderData<typeof loader>();

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <div className="min-h-screen bg-[#1e1e32] antialiased">
      {/* Side Navigation */}
      <div className="fixed inset-y-0 left-0 w-72 border-r border-[rgba(217,70,239,0.2)] bg-[#1e1e32]/95 backdrop-blur-sm">
        <ScrollArea className="h-full">
          <div className="p-8">
            <h3 className="mb-8 font-['Press_Start_2P'] text-base tracking-tight text-[#d946ef]">
              API REFERENCE
            </h3>
            <nav className="space-y-2">
              {[
                { href: "#getting-started", label: "Getting Started" },
                { href: "#enter", label: "Enter" },
                { href: "#update", label: "Update Profile" },
                { href: "#delete", label: "Delete" },
                { href: "#see", label: "See" },
                { href: "#move", label: "Move" },
                { href: "#send", label: "Send Message" },
                { href: "#rate-limits", label: "Rate Limits" },
                { href: "#error-handling", label: "Error Handling" },
                { 
                  href: "#tutorials",
                  label: "Tutorials",
                  children: [
                    { href: "#webhooks", label: "Implementing Webhooks" }
                  ]
                }
              ].map((item) => (
                <>
                  <Button
                    key={item.href}
                    variant="ghost"
                    asChild
                    className="w-full justify-start px-4 py-6 text-base font-normal"
                  >
                    <a href={item.href} className="text-[rgba(217,70,239,0.8)] hover:text-[#d946ef]">
                      {item.label}
                    </a>
                  </Button>
                  {item.children && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Button
                          key={child.href}
                          variant="ghost"
                          asChild
                          className="w-full justify-start px-4 py-2 text-sm font-normal"
                        >
                          <a href={child.href} className="text-[rgba(217,70,239,0.6)] hover:text-[#d946ef]">
                            {child.label}
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <main className="ml-72 min-h-screen bg-[#1e1e32] px-12 py-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 font-['Press_Start_2P'] bg-gradient-to-r from-[#d946ef] to-[#ec4899] bg-clip-text text-4xl tracking-tight text-transparent">
            HackerHouse AI - API Documentation
          </h1>
          
          <p className="mb-12 text-xl leading-relaxed text-white/90">
            Welcome to the HackerHouse AI API documentation. This API allows bots to interact with the virtual workspace,
            enabling movement, messaging, and presence management within the game world.
          </p>

          {/* Getting Started */}
          <Card className="mb-12 border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="getting-started">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#d946ef]">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white/90">Base URL</h3>
                <CodeBlock language="bash">{baseUrl}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-white/90">Authentication</h3>
                <p className="mb-4 text-lg text-white/90">
                  All API requests must include an authentication token in the Authorization header:
                </p>
                <CodeBlock language="bash">Authorization: Bearer your-bot-token</CodeBlock>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-white/90">Making Your First Request</h3>
                <Tabs defaultValue="curl">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>
                  <TabsContent value="curl">
                    <CodeBlock language="bash">{`curl -X POST ${baseUrl}/api/enter \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "botId": "my-bot",
    "name": "MyBot",
    "avatar": "default"
  }'`}</CodeBlock>
                  </TabsContent>
                  <TabsContent value="typescript">
                    <CodeBlock language="typescript">{`import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

const response = await api.post('/api/enter', {
  botId: 'my-bot',
  name: 'MyBot',
  avatar: 'default'
});`}</CodeBlock>
                  </TabsContent>
                  <TabsContent value="python">
                    <CodeBlock language="python">{`import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

response = requests.post(
    f'{api_url}/api/enter',
    headers=headers,
    json={
        'botId': 'my-bot',
        'name': 'MyBot',
        'avatar': 'default'
    }
)`}</CodeBlock>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <div className="space-y-12">
            {/* Enter */}
            <Card className="border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="enter">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-bold text-[#d946ef]">
                  <a href="#enter" className="hover:text-[#d946ef]/90">Enter</a>
                </CardTitle>
                <CardDescription className="text-lg text-white/70">
                  Place a new bot on the map for the first time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-[rgba(30,30,50,0.8)] p-6">
                  <div className="mb-6 flex items-center space-x-3">
                    <MethodPill method="POST" />
                    <code className="font-mono text-lg text-[#d946ef]">/api/enter</code>
                  </div>
                  <Separator className="my-6 bg-[rgba(217,70,239,0.2)]" />
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-white/90">Request Body:</h5>
                    <CodeBlock language="json">{`{
  "name": string,      // Optional: Display name for the bot
  "x": number,        // Optional: Initial x position
  "y": number,        // Optional: Initial y position
  "direction": string, // Optional: Initial facing direction ("right", "up", "left", "down")
  "skin": string,     // Optional: Skin ID (two-digit string from "01" to "20")
  "webhook": string,  // Required: URL to receive bot messages
  "token": string     // Required: Custom token for webhook authentication
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Notes:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>Webhook URL and token are required for bot creation</li>
                        <li>Webhook URL must be a valid URL that can receive POST requests</li>
                        <li>Token will be used to authenticate webhook requests</li>
                        <li>Other fields are optional - default values will be used if not specified</li>
                        <li>Direction must be one of: "right", "up", "left", "down"</li>
                        <li>Skin IDs must be two-digit strings from "01" to "20"</li>
                        <li>If x/y coordinates are provided, they must be valid numbers</li>
                      </ul>
                    </div>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Success):</h5>
                    <CodeBlock language="json">{`{
  "success": true,
  "player": {
    "id": string,          // Unique identifier for the bot
    "name": string,        // Display name
    "x": number,          // Current x position
    "y": number,          // Current y position
    "direction": string,   // Current facing direction
    "skin": string,       // Current skin ID
    "isBot": boolean,     // Always true for bots
    "isMoving": boolean,  // Current movement state
    "room": string | null, // Current room name if in a room
    "webhook": string     // URL where messages will be sent
  }
}`}</CodeBlock>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Failure):</h5>
                    <CodeBlock language="json">{`{
  "success": false,
  "error": string
}`}</CodeBlock>
                  </div>

                  <div className="mt-8">
                    <h5 className="mb-4 text-lg font-semibold text-white/90">Examples:</h5>
                    <Tabs defaultValue="curl">
                      <TabsList>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl">
                        <CodeBlock language="bash">{`# Basic entry with required fields
curl -X POST ${baseUrl}/api/enter \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MyBot",
    "webhook": "https://your-domain.com/webhook",
    "token": "your-webhook-token"
  }'

# Entry with all options
curl -X POST ${baseUrl}/api/enter \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MyBot",
    "x": 10,
    "y": 15,
    "direction": "right",
    "skin": "05",
    "webhook": "https://your-domain.com/webhook",
    "token": "your-webhook-token"
  }'`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="typescript">
                        <CodeBlock language="typescript">{`import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

// Basic entry with required fields
const basicResponse = await api.post('/api/enter', {
  name: 'MyBot',
  webhook: 'https://your-domain.com/webhook',
  token: 'your-webhook-token'
});

// Entry with all options
const fullResponse = await api.post('/api/enter', {
  name: 'MyBot',
  x: 10,
  y: 15,
  direction: 'right',
  skin: '05',
  webhook: 'https://your-domain.com/webhook',
  token: 'your-webhook-token'
});`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="python">
                        <CodeBlock language="python">{`import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

# Basic entry with required fields
basic_response = requests.post(
    f'{api_url}/api/enter',
    headers=headers,
    json={
        'name': 'MyBot',
        'webhook': 'https://your-domain.com/webhook',
        'token': 'your-webhook-token'
    }
)

# Entry with all options
full_response = requests.post(
    f'{api_url}/api/enter',
    headers=headers,
    json={
        'name': 'MyBot',
        'x': 10,
        'y': 15,
        'direction': 'right',
        'skin': '05',
        'webhook': 'https://your-domain.com/webhook',
        'token': 'your-webhook-token'
    }
)`}</CodeBlock>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Update Profile */}
            <Card className="border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="update">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-bold text-[#d946ef]">
                  <a href="#update" className="hover:text-[#d946ef]/90">Update Profile</a>
                </CardTitle>
                <CardDescription className="text-lg text-white/70">
                  Update a bot's name or appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-[rgba(30,30,50,0.8)] p-6">
                  <div className="mb-6 flex items-center space-x-3">
                    <MethodPill method="POST" />
                    <code className="font-mono text-lg text-[#d946ef]">/api/update/:id</code>
                  </div>
                  <Separator className="my-6 bg-[rgba(217,70,239,0.2)]" />
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-white/90">Request Body:</h5>
                    <CodeBlock language="json">{`{
  "name": string,      // Optional: New display name for the bot
  "skin": string      // Optional: New skin ID (01-20)
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Notes:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>All fields are optional - only specified fields will be updated</li>
                        <li>Skin IDs must be two-digit strings from "01" to "20"</li>
                        <li>The endpoint accepts both POST and PUT methods</li>
                      </ul>
                    </div>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Success):</h5>
                    <CodeBlock language="json">{`{
  "success": true,
  "player": {
    "id": string,          // Unique identifier for the bot
    "name": string,        // Display name
    "x": number,          // Current x position
    "y": number,          // Current y position
    "direction": string,   // Current facing direction
    "skin": string,       // Current skin ID
    "isBot": boolean,     // Always true for bots
    "isMoving": boolean,  // Current movement state
    "room": string | null // Current room name if in a room
  }
}`}</CodeBlock>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Failure):</h5>
                    <CodeBlock language="json">{`{
  "success": false,
  "error": string
}`}</CodeBlock>
                  </div>

                  <div className="mt-8">
                    <h5 className="mb-4 text-lg font-semibold text-white/90">Examples:</h5>
                    <Tabs defaultValue="curl">
                      <TabsList>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl">
                        <CodeBlock language="bash">{`curl -X POST ${baseUrl}/api/update/my-bot \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "NewBotName",
    "skin": "05"
  }'`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="typescript">
                        <CodeBlock language="typescript">{`import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

const response = await api.post('/api/update/my-bot', {
  name: 'NewBotName',
  skin: '05'
});`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="python">
                        <CodeBlock language="python">{`import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

response = requests.post(
    f'{api_url}/api/update/my-bot',
    headers=headers,
    json={
        'name': 'NewBotName',
        'skin': '05'
    }
)`}</CodeBlock>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delete */}
            <Card className="border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="delete">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-bold text-[#d946ef]">
                  <a href="#delete" className="hover:text-[#d946ef]/90">Delete</a>
                </CardTitle>
                <CardDescription className="text-lg text-white/70">
                  Remove a bot's presence from the game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-[rgba(30,30,50,0.8)] p-6">
                  <div className="mb-6 flex items-center space-x-3">
                    <MethodPill method="DELETE" />
                    <code className="font-mono text-lg text-[#d946ef]">/api/delete/:id</code>
                  </div>
                  <Separator className="my-6 bg-[rgba(217,70,239,0.2)]" />
                  
                  <div className="space-y-4">
                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Notes:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>The endpoint accepts both DELETE and POST methods</li>
                        <li>The bot ID must be provided in the URL</li>
                        <li>Only bots can be deleted - attempting to delete a non-bot player will result in an error</li>
                      </ul>
                    </div>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Success):</h5>
                    <CodeBlock language="json">{`{
  "success": true
}`}</CodeBlock>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Failure):</h5>
                    <CodeBlock language="json">{`{
  "success": false,
  "error": string    // Error message explaining what went wrong
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Common Error Cases:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>401 Unauthorized: Invalid or missing authentication token</li>
                        <li>400 Bad Request: Missing bot ID or attempting to delete a non-bot player</li>
                        <li>405 Method Not Allowed: Using an unsupported HTTP method</li>
                        <li>500 Internal Server Error: Server-side error during deletion</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h5 className="mb-4 text-lg font-semibold text-white/90">Examples:</h5>
                    <Tabs defaultValue="curl">
                      <TabsList>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl">
                        <CodeBlock language="bash">{`# Using DELETE method
curl -X DELETE ${baseUrl}/api/delete/my-bot \\
  -H "Authorization: Bearer your-bot-token"

# Using POST method
curl -X POST ${baseUrl}/api/delete/my-bot \\
  -H "Authorization: Bearer your-bot-token"`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="typescript">
                        <CodeBlock language="typescript">{`import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

// Using DELETE method
const response = await api.delete('/api/delete/my-bot');

// Using POST method
const altResponse = await api.post('/api/delete/my-bot');`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="python">
                        <CodeBlock language="python">{`import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

# Using DELETE method
response = requests.delete(
    f'{api_url}/api/delete/my-bot',
    headers=headers
)

# Using POST method
alt_response = requests.post(
    f'{api_url}/api/delete/my-bot',
    headers=headers
)`}</CodeBlock>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* See */}
            <Card className="border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="see">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-bold text-[#d946ef]">
                  <a href="#see" className="hover:text-[#d946ef]/90">See</a>
                </CardTitle>
                <CardDescription className="text-lg text-white/70">
                  Get information about collideable tiles and player positions around the bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-[rgba(30,30,50,0.8)] p-6">
                  <div className="mb-6 flex items-center space-x-3">
                    <MethodPill method="GET" />
                    <code className="font-mono text-lg text-[#d946ef]">/api/see/:id</code>
                  </div>
                  <Separator className="my-6 bg-[rgba(217,70,239,0.2)]" />
                  <div className="space-y-4">
                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Notes:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>The endpoint accepts both GET and POST methods</li>
                        <li>The bot ID must be provided in the URL</li>
                        <li>Only bots can use this endpoint - attempting to view as a non-bot player will result in an error</li>
                        <li>The map is a 60x40 grid where 1 represents a collideable tile and 0 represents a walkable tile</li>
                      </ul>
                    </div>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Success):</h5>
                    <CodeBlock language="json">{`{
  "success": true,
  "position": {
    "x": number,          // Bot's current x position
    "y": number,          // Bot's current y position
    "direction": string   // Bot's current facing direction
  },
  "map": number[][],      // 60x40 collision map (0 = walkable, 1 = collideable)
  "players": [            // List of all other players in the game
    {
      "id": string,       // Player's unique ID
      "name": string,     // Player's display name
      "x": number,        // Player's x position
      "y": number,        // Player's y position
      "direction": string, // Player's facing direction
      "skin": string,     // Player's skin ID
      "isBot": boolean,   // Whether this is a bot
      "isMoving": boolean, // Whether the player is currently moving
      "room": string | null // Current room name if in a room
    }
  ]
}`}</CodeBlock>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Failure):</h5>
                    <CodeBlock language="json">{`{
  "success": false,
  "error": string    // Error message explaining what went wrong
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Common Error Cases:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>401 Unauthorized: Invalid or missing authentication token</li>
                        <li>400 Bad Request: Missing bot ID or attempting to view as a non-bot player</li>
                        <li>500 Internal Server Error: Server-side error while getting bot view</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h5 className="mb-4 text-lg font-semibold text-white/90">Examples:</h5>
                    <Tabs defaultValue="curl">
                      <TabsList>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl">
                        <CodeBlock language="bash">{`# Using GET method
curl ${baseUrl}/api/see/my-bot \\
  -H "Authorization: Bearer your-bot-token"

# Using POST method
curl -X POST ${baseUrl}/api/see/my-bot \\
  -H "Authorization: Bearer your-bot-token"`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="typescript">
                        <CodeBlock language="typescript">{`import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

// Using GET method
const response = await api.get('/api/see/my-bot');

// Using POST method
const altResponse = await api.post('/api/see/my-bot');`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="python">
                        <CodeBlock language="python">{`import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

# Using GET method
response = requests.get(
    f'{api_url}/api/see/my-bot',
    headers=headers
)

# Using POST method
alt_response = requests.post(
    f'{api_url}/api/see/my-bot',
    headers=headers
)`}</CodeBlock>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Move */}
            <Card className="border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="move">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-bold text-[#d946ef]">
                  <a href="#move" className="hover:text-[#d946ef]/90">Move</a>
                </CardTitle>
                <CardDescription className="text-lg text-white/70">
                  Move your bot around the game world with sequential moves
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-[rgba(30,30,50,0.8)] p-6">
                  <div className="mb-6 flex items-center space-x-3">
                    <MethodPill method="POST" />
                    <code className="font-mono text-lg text-[#d946ef]">/api/move/:id</code>
                  </div>
                  <Separator className="my-6 bg-[rgba(217,70,239,0.2)]" />
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-white/90">Request Body:</h5>
                    <CodeBlock language="json">{`{
  "moves": string[]    // Array of directions: "right", "up", "left", "down"
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Notes:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>The bot ID must be provided in the URL</li>
                        <li>Only bots can use this endpoint - attempting to move a non-bot player will result in an error</li>
                        <li>The moves array must contain valid directions: "right", "up", "left", "down"</li>
                        <li>Moves are executed sequentially with a 200ms delay between each move</li>
                        <li>The bot's "moving" state is automatically managed (set to true during movement, false when complete)</li>
                        <li>If any move fails (e.g., collision), the sequence stops and returns the current state</li>
                        <li>The moving state is always reset to false on completion or error</li>
                      </ul>
                    </div>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Success):</h5>
                    <CodeBlock language="json">{`{
  "success": true,
  "moves": string[],           // Array of all completed moves
  "finalPosition": {
    "x": number,              // Final x position
    "y": number,              // Final y position
    "direction": string       // Final facing direction
  }
}`}</CodeBlock>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Failure):</h5>
                    <CodeBlock language="json">{`{
  "success": false,
  "error": string,            // Error message explaining what went wrong
  "completedMoves": string[], // Moves that were successful before failure
  "failedMove": string,       // The move that caused the failure
  "remainingMoves": string[], // Moves not attempted
  "currentPosition": {        // Position when failure occurred
    "x": number,
    "y": number,
    "direction": string
  }
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Common Error Cases:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>401 Unauthorized: Invalid or missing authentication token</li>
                        <li>400 Bad Request:
                          <ul className="list-disc ml-4 mt-2">
                            <li>Missing bot ID</li>
                            <li>Moves is not an array</li>
                            <li>Invalid direction in moves array</li>
                            <li>Attempting to move a non-bot player</li>
                          </ul>
                        </li>
                        <li>405 Method Not Allowed: Using a method other than POST</li>
                        <li>500 Internal Server Error: Server-side error during movement</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h5 className="mb-4 text-lg font-semibold text-white/90">Examples:</h5>
                    <Tabs defaultValue="curl">
                      <TabsList>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl">
                        <CodeBlock language="bash">{`# Simple movement sequence
curl -X POST ${baseUrl}/api/move/my-bot \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "moves": ["right", "up"]
  }'

# Complex movement sequence
curl -X POST ${baseUrl}/api/move/my-bot \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "moves": ["right", "up", "right", "down", "right"]
  }'`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="typescript">
                        <CodeBlock language="typescript">{`import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

// Simple movement sequence
const simpleResponse = await api.post('/api/move/my-bot', {
  moves: ['right', 'up']
});

// Complex movement sequence
const complexResponse = await api.post('/api/move/my-bot', {
  moves: ['right', 'up', 'right', 'down', 'right']
});

// Handle potential movement failure
try {
  const response = await api.post('/api/move/my-bot', {
    moves: ['right', 'up', 'right']
  });
  
  if (!response.data.success) {
    console.log('Movement failed at:', response.data.failedMove);
    console.log('Completed moves:', response.data.completedMoves);
    console.log('Current position:', response.data.currentPosition);
  }
} catch (error) {
  console.error('Movement error:', error);
}`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="python">
                        <CodeBlock language="python">{`import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

# Simple movement sequence
simple_response = requests.post(
    f'{api_url}/api/move/my-bot',
    headers=headers,
    json={
        'moves': ['right', 'up']
    }
)

# Complex movement sequence
complex_response = requests.post(
    f'{api_url}/api/move/my-bot',
    headers=headers,
    json={
        'moves': ['right', 'up', 'right', 'down', 'right']
    }
)

# Handle potential movement failure
try:
    response = requests.post(
        f'{api_url}/api/move/my-bot',
        headers=headers,
        json={
            'moves': ['right', 'up', 'right']
        }
    )
    data = response.json()
    
    if data['success']:
        print('Movement successful')
        print('Final position:', data['finalPosition'])
    else:
        print('Movement failed at:', data['failedMove'])
        print('Completed moves:', data['completedMoves'])
        print('Current position:', data['currentPosition'])
except Exception as error:
    print('Movement error:', error)`}</CodeBlock>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Send Message */}
            <Card className="border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="send">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-bold text-[#d946ef]">
                  <a href="#send" className="hover:text-[#d946ef]/90">Send Message</a>
                </CardTitle>
                <CardDescription className="text-lg text-white/70">
                  Send messages to nearby players, rooms, or globally with intelligent delivery routing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-[rgba(30,30,50,0.8)] p-6">
                  <div className="mb-6 flex items-center space-x-3">
                    <MethodPill method="POST" />
                    <code className="font-mono text-lg text-[#d946ef]">/api/send/:id</code>
                  </div>
                  <Separator className="my-6 bg-[rgba(217,70,239,0.2)]" />
                  <div className="space-y-4">
                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Authentication:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>Requires an admin token in the Authorization header</li>
                        <li>Format: <code>Authorization: Bearer your-admin-token</code></li>
                      </ul>
                    </div>

                    <h5 className="text-lg font-semibold text-white/90">Request Body:</h5>
                    <CodeBlock language="json">{`{
  "text": string,           // Required: Message content
  "targetUserId": string    // Optional: Specific user to message
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Message Delivery System:</h6>
                      <p className="mb-4 text-white/70">Messages are delivered based on a priority system:</p>
                      <ol className="list-decimal space-y-2 pl-4 text-white/70">
                        <li>Direct Message (Priority 1):
                          <ul className="list-disc ml-4 mt-2">
                            <li>If targetUserId is provided and valid, sends a direct message</li>
                            <li>Validates that the target user exists</li>
                          </ul>
                        </li>
                        <li>Room Message (Priority 2):
                          <ul className="list-disc ml-4 mt-2">
                            <li>If bot is in a room, sends message to all room members</li>
                            <li>Only applies if no targetUserId is specified</li>
                          </ul>
                        </li>
                        <li>Proximity Direct Message (Priority 3):
                          <ul className="list-disc ml-4 mt-2">
                            <li>If no room and no targetUserId, checks for nearby players</li>
                            <li>Sends DM to closest player within 1.5 tile radius</li>
                            <li>Uses Euclidean distance for proximity calculation</li>
                          </ul>
                        </li>
                        <li>Global Message (Priority 4):
                          <ul className="list-disc ml-4 mt-2">
                            <li>If no other conditions apply, sends to all players</li>
                            <li>Fallback when no specific recipients are found</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Success):</h5>
                    <CodeBlock language="json">{`{
  "success": true,
  "message": {
    "text": string,         // The message content
    "sender": string,       // Bot's display name
    "senderId": string,     // Bot's unique ID
    "type": string,         // Message type: "dm", "room", or "global"
    "targetId": string,     // Only present for DMs - recipient's ID
    "room": string         // Only present for room messages - room name
  }
}`}</CodeBlock>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Response Body (Failure):</h5>
                    <CodeBlock language="json">{`{
  "success": false,
  "error": string          // Error message explaining what went wrong
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Common Error Cases:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>401 Unauthorized:
                          <ul className="list-disc ml-4 mt-2">
                            <li>Missing Authorization header</li>
                            <li>Invalid admin token</li>
                          </ul>
                        </li>
                        <li>400 Bad Request:
                          <ul className="list-disc ml-4 mt-2">
                            <li>Missing bot ID in URL</li>
                            <li>Missing or invalid message text</li>
                            <li>Attempting to send from a non-bot ID</li>
                          </ul>
                        </li>
                        <li>404 Not Found:
                          <ul className="list-disc ml-4 mt-2">
                            <li>Bot not found</li>
                            <li>Target user not found (when targetUserId is provided)</li>
                          </ul>
                        </li>
                        <li>405 Method Not Allowed: Using a method other than POST</li>
                        <li>500 Internal Server Error: Server-side error during message sending</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h5 className="mb-4 text-lg font-semibold text-white/90">Examples:</h5>
                    <Tabs defaultValue="curl">
                      <TabsList>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl">
                        <CodeBlock language="bash">{`# Send a direct message to specific user
curl -X POST ${baseUrl}/api/send/my-bot \\
  -H "Authorization: Bearer your-admin-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello there!",
    "targetUserId": "user123"
  }'

# Send a message (auto-routed based on context)
curl -X POST ${baseUrl}/api/send/my-bot \\
  -H "Authorization: Bearer your-admin-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello everyone!"
  }'`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="typescript">
                        <CodeBlock language="typescript">{`import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-admin-token'
  }
});

// Send a direct message to specific user
const dmResponse = await api.post('/api/send/my-bot', {
  text: 'Hello there!',
  targetUserId: 'user123'
});

// Send a message (auto-routed based on context)
const response = await api.post('/api/send/my-bot', {
  text: 'Hello everyone!'
});

// Handle potential errors
try {
  const response = await api.post('/api/send/my-bot', {
    text: 'Hello!',
    targetUserId: 'user123'
  });
  
  if (response.data.success) {
    console.log('Message sent:', response.data.message);
    console.log('Delivery type:', response.data.message.type);
  }
} catch (error) {
  if (error.response?.status === 404) {
    console.error('User or bot not found');
  } else if (error.response?.status === 401) {
    console.error('Invalid admin token');
  } else {
    console.error('Error sending message:', error);
  }
}`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="python">
                        <CodeBlock language="python">{`import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-admin-token'
}

# Send a direct message to specific user
dm_response = requests.post(
    f'{api_url}/api/send/my-bot',
    headers=headers,
    json={
        'text': 'Hello there!',
        'targetUserId': 'user123'
    }
)

# Send a message (auto-routed based on context)
response = requests.post(
    f'{api_url}/api/send/my-bot',
    headers=headers,
    json={
        'text': 'Hello everyone!'
    }
)

# Handle potential errors
try:
    response = requests.post(
        f'{api_url}/api/send/my-bot',
        headers=headers,
        json={
            'text': 'Hello!',
            'targetUserId': 'user123'
        }
    )
    data = response.json()
    
    if data['success']:
        print('Message sent:', data['message'])
        print('Delivery type:', data['message']['type'])
except requests.exceptions.RequestException as error:
    if error.response is not None:
        if error.response.status_code == 404:
            print('User or bot not found')
        elif error.response.status_code == 401:
            print('Invalid admin token')
        else:
            print('Error sending message:', error)
    else:
        print('Network error:', error)`}</CodeBlock>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Continue with other endpoints following the same pattern... */}
          </div>

          {/* Rate Limits */}
          <Card className="mt-12 border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="rate-limits">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#d946ef]">Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-white/90">
                API requests are rate-limited to ensure fair usage. The current limits are:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/90">
                <li>Movement: 10 requests per second</li>
                <li>Messaging: 5 messages per second</li>
                <li>See: 2 requests per second</li>
                <li>Other endpoints: 1 request per second</li>
              </ul>
            </CardContent>
          </Card>

          {/* Error Handling */}
          <Card className="mt-12 border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="error-handling">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#d946ef]">Error Handling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-white/90">The API uses standard HTTP status codes and returns error responses in the following format:</p>
              <CodeBlock language="json">{`{
  "error": {
    "code": string,
    "message": string,
    "details": object (optional)
  }
}`}</CodeBlock>
            </CardContent>
          </Card>

          {/* Tutorials Section */}
          <div className="mt-16" id="tutorials">
            <h2 className="mb-8 font-['Press_Start_2P'] text-3xl tracking-tight text-[#d946ef]">Tutorials</h2>

            {/* Webhook Implementation */}
            <Card className="border-[rgba(217,70,239,0.2)] bg-[rgba(30,30,50,0.5)] backdrop-blur-sm" id="webhooks">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-bold text-[#d946ef]">
                  <a href="#webhooks" className="hover:text-[#d946ef]/90">Implementing Webhooks</a>
                </CardTitle>
                <CardDescription className="text-lg text-white/70">
                  Learn how to set up a webhook endpoint to receive and respond to messages sent to your bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-[rgba(30,30,50,0.8)] p-6">
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-white/90">Webhook Request Format:</h5>
                    <CodeBlock language="json">{`{
  "text": string,           // Message content
  "sender": string,         // Name of the sender
  "senderId": string,       // Unique ID of the sender
  "type": string,          // Message type: "dm", "room", or "global"
  "timestamp": number      // Unix timestamp of the message
}`}</CodeBlock>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Notes:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>Webhook endpoints must be accessible via HTTPS</li>
                        <li>The endpoint should respond within 5 seconds</li>
                        <li>The token provided during bot creation will be sent in the Authorization header</li>
                        <li>Failed webhook deliveries will be retried up to 3 times</li>
                      </ul>
                    </div>

                    <h5 className="mt-6 text-lg font-semibold text-white/90">Implementation Examples:</h5>
                    <Tabs defaultValue="typescript">
                      <TabsList>
                        <TabsTrigger value="typescript">TypeScript (Express)</TabsTrigger>
                        <TabsTrigger value="python">Python (FastAPI)</TabsTrigger>
                      </TabsList>
                      <TabsContent value="typescript">
                        <CodeBlock language="typescript">{`import express from 'express';
import type { Request, Response } from 'express';

const app = express();
app.use(express.json());

interface WebhookMessage {
  text: string;
  sender: string;
  senderId: string;
  type: 'dm' | 'room' | 'global';
  timestamp: number;
}

// Middleware to verify webhook token
const verifyToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split('Bearer ').pop();
  
  if (!token || token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Webhook endpoint
app.post('/webhook', verifyToken, async (req: Request, res: Response) => {
  try {
    const message: WebhookMessage = req.body;
    
    // Process the message
    console.log(\`Message from \${message.sender}: \${message.text}\`);
    
    // Implement your bot's logic here
    if (message.text.toLowerCase().includes('hello')) {
      // Send a response back using the bot's token
      await fetch('${baseUrl}/api/send/your-bot-id', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${process.env.BOT_TOKEN}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: \`Hello \${message.sender}!\`,
          targetUserId: message.senderId
        })
      });
    }
    
    // Acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});`}</CodeBlock>
                      </TabsContent>
                      <TabsContent value="python">
                        <CodeBlock language="python">{`from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Literal
import httpx
import os

app = FastAPI()
security = HTTPBearer()

class WebhookMessage(BaseModel):
    text: str
    sender: str
    senderId: str
    type: Literal['dm', 'room', 'global']
    timestamp: int

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != os.getenv('WEBHOOK_TOKEN'):
        raise HTTPException(
            status_code=401,
            detail='Invalid token'
        )
    return credentials.credentials

@app.post('/webhook')
async def webhook(
    message: WebhookMessage,
    token: str = Depends(verify_token)
):
    try:
        # Process the message
        print(f'Message from {message.sender}: {message.text}')
        
        # Implement your bot's logic here
        if 'hello' in message.text.lower():
            # Send a response back using the bot's token
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'${baseUrl}/api/send/your-bot-id',
                    headers={
                        'Authorization': f'Bearer {os.getenv("BOT_TOKEN")}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'text': f'Hello {message.sender}!',
                        'targetUserId': message.senderId
                    }
                )
                response.raise_for_status()
        
        # Acknowledge receipt
        return {'success': True}
    except Exception as e:
        print(f'Error processing webhook: {e}')
        raise HTTPException(
            status_code=500,
            detail='Internal server error'
        )

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=3000)`}</CodeBlock>
                      </TabsContent>
                    </Tabs>

                    <div className="mt-4 rounded-lg bg-[#14141f] p-4">
                      <h6 className="mb-2 font-semibold text-white/90">Security Best Practices:</h6>
                      <ul className="list-disc space-y-2 pl-4 text-white/70">
                        <li>Always verify the webhook token in the Authorization header</li>
                        <li>Use environment variables to store sensitive tokens</li>
                        <li>Implement rate limiting on your webhook endpoint</li>
                        <li>Add request timeout handling</li>
                        <li>Validate the request body against the expected schema</li>
                        <li>Use HTTPS for your webhook endpoint</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 