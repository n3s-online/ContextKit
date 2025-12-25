import { NextResponse } from 'next/server';
import { getAllSnippets, createSnippet, type CreateSnippetInput } from '@contextkit/shared';
import { db, validateTags } from '@/lib/db';

/**
 * GET /api/snippets - List all snippets
 */
export async function GET() {
  try {
    const snippets = getAllSnippets(db());
    return NextResponse.json(snippets);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/snippets failed:', msg);
    return NextResponse.json(
      { error: 'Failed to fetch snippets', details: msg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/snippets - Create a new snippet
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate title
    if (typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'title is required and must be a string' },
        { status: 400 }
      );
    }
    const title = body.title.trim();
    if (title === '') {
      return NextResponse.json(
        { error: 'title cannot be empty' },
        { status: 400 }
      );
    }

    // Validate content
    if (typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }
    if (body.content === '') {
      return NextResponse.json(
        { error: 'content cannot be empty' },
        { status: 400 }
      );
    }

    // Validate tags (optional, defaults to [])
    let tags: string[] = [];
    if (body.tags !== undefined) {
      const validated = validateTags(body.tags);
      if (validated === null) {
        return NextResponse.json(
          { error: 'tags must be an array of non-empty strings' },
          { status: 400 }
        );
      }
      tags = validated;
    }

    const input: CreateSnippetInput = { title, content: body.content, tags };
    const snippet = createSnippet(db(), input);

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/snippets failed:', msg);
    return NextResponse.json(
      { error: 'Failed to create snippet', details: msg },
      { status: 500 }
    );
  }
}
