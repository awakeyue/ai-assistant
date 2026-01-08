import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/models/[id]/default - Set a model as the default
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if model exists and belongs to user
    const model = await prisma.userModel.findFirst({
      where: { id, userId: user.id },
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Remove default from all other models
    await prisma.userModel.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Set this model as default
    const updatedModel = await prisma.userModel.update({
      where: { id },
      data: { isDefault: true },
    });

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error("Failed to set default model:", error);
    return NextResponse.json(
      { error: "Failed to set default model" },
      { status: 500 },
    );
  }
}
