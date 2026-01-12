import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptApiKey, maskApiKey, decryptApiKey } from "@/lib/crypto";
import { UserModelFormData } from "@/types/chat";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/models/[id] - Get a specific model by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const model = await prisma.userModel.findFirst({
      where: { id, userId: user.id },
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...model,
      apiKey: maskApiKey(decryptApiKey(model.apiKey)),
    });
  } catch (error) {
    console.error("Failed to fetch model:", error);
    return NextResponse.json(
      { error: "Failed to fetch model" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/models/[id] - Update a model configuration
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if model exists and belongs to user
    const existingModel = await prisma.userModel.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingModel) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const body: Partial<UserModelFormData> = await req.json();

    // Build update data
    const updateData: {
      name?: string;
      modelId?: string;
      baseURL?: string;
      apiKey?: string;
      description?: string | null;
      logoUrl?: string | null;
      systemPrompt?: string | null;
      isPublic?: boolean;
      supportsVision?: boolean;
    } = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.modelId !== undefined) updateData.modelId = body.modelId;
    if (body.baseURL !== undefined) updateData.baseURL = body.baseURL;
    if (body.description !== undefined)
      updateData.description = body.description || null;
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl || null;
    if (body.systemPrompt !== undefined)
      updateData.systemPrompt = body.systemPrompt || null;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.supportsVision !== undefined)
      updateData.supportsVision = body.supportsVision;

    // Only update API key if a new one is provided (not masked)
    if (body.apiKey && !body.apiKey.includes("****")) {
      updateData.apiKey = encryptApiKey(body.apiKey);
    }

    const updatedModel = await prisma.userModel.update({
      where: { id },
      data: updateData,
    });

    // Return with masked API key
    const decryptedKey = decryptApiKey(updatedModel.apiKey);
    return NextResponse.json({
      ...updatedModel,
      apiKey: maskApiKey(decryptedKey),
    });
  } catch (error) {
    console.error("Failed to update model:", error);
    return NextResponse.json(
      { error: "Failed to update model" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/models/[id] - Delete a model configuration
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if model exists and belongs to user
    const existingModel = await prisma.userModel.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingModel) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Delete the model
    await prisma.userModel.delete({
      where: { id },
    });

    // If deleted model was default, set another model as default
    if (existingModel.isDefault) {
      const firstModel = await prisma.userModel.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });

      if (firstModel) {
        await prisma.userModel.update({
          where: { id: firstModel.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete model:", error);
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 },
    );
  }
}
