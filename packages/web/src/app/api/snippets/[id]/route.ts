import { NextResponse } from 'next/server';
import {
  getSnippet,
  updateSnippet,
  deleteSnippet,
  getSnippetVersions,
  type UpdateSnippetInput,
} from '@contextkit/shared';
import { db, isValidUUID, validateTags } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/snippets/[id] - Get a single snippet with versions
 */
export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid snippet ID format' },
        { status: 400 }
      );
    }

    const snippet = getSnippet(db(), id);
    if (!snippet) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      );
    }

    const versions = getSnippetVersions(db(), id);
    return NextResponse.json({ ...snippet, versions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`GET /api/snippets/[id] failed:`, msg);
    return NextResponse.json(
      { error: 'Failed to fetch snippet', details: msg },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/snippets/[id] - Update a snippet (creates version)
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid snippet ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate at least one field to update
    if (body.title === undefined && body.content === undefined && body.tags === undefined) {
      return NextResponse.json(
        { error: 'At least one field (title, content, tags) must be provided' },
        { status: 400 }
      );
    }

    const input: UpdateSnippetInput = {};

    // Validate title if provided
    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        return NextResponse.json(
          { error: 'title must be a string' },
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
      input.title = title;
    }

    // Validate content if provided
    if (body.content !== undefined) {
      if (typeof body.content !== 'string') {
        return NextResponse.json(
          { error: 'content must be a string' },
          { status: 400 }
        );
      }
      if (body.content === '') {
        return NextResponse.json(
          { error: 'content cannot be empty' },
          { status: 400 }
        );
      }
      input.content = body.content;
    }

    // Validate tags if provided
    if (body.tags !== undefined) {
      const validated = validateTags(body.tags);
      if (validated === null) {
        return NextResponse.json(
          { error: 'tags must be an array of non-empty strings' },
          { status: 400 }
        );
      }
      input.tags = validated;
    }

    const snippet = updateSnippet(db(), id, input);
    if (!snippet) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(snippet);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`PUT /api/snippets/[id] failed:`, msg);
    return NextResponse.json(
      { error: 'Failed to update snippet', details: msg },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/snippets/[id] - Delete a snippet
 */
export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid snippet ID format' },
        { status: 400 }
      );
    }

    const deleted = deleteSnippet(db(), id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      );
    }

    // Return 204 No Content for successful deletion
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`DELETE /api/snippets/[id] failed:`, msg);
    return NextResponse.json(
      { error: 'Failed to delete snippet', details: msg },
      { status: 500 }
    );
  }
}
