import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptApiKey, maskApiKey } from "@/lib/crypto";
import { UserModelFormData } from "@/types/chat";

const MAX_MODELS_PER_USER = 20;

/**
 * GET /api/models - Get all models for the current user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const models = await prisma.userModel.findMany({
      where: {
        OR: [{ userId: user.id }, { isPublic: true }],
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    // Mask API keys for response
    const maskedModels = models.map((model) => ({
      ...model,
      apiKey: maskApiKey(model.apiKey),
    }));

    return NextResponse.json(maskedModels);
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/models - Create a new model configuration
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UserModelFormData = await req.json();

    // Validate required fields
    if (!body.name || !body.modelId || !body.baseURL || !body.apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: name, modelId, baseURL, apiKey" },
        { status: 400 },
      );
    }

    // Check model count limit
    const modelCount = await prisma.userModel.count({
      where: { userId: user.id },
    });

    if (modelCount >= MAX_MODELS_PER_USER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_MODELS_PER_USER} models allowed per user` },
        { status: 400 },
      );
    }

    // Check if model name already exists for this user
    const existingModel = await prisma.userModel.findFirst({
      where: {
        userId: user.id,
        name: body.name,
      },
    });

    if (existingModel) {
      return NextResponse.json(
        { error: "模型名称已存在，请使用其他名称" },
        { status: 400 },
      );
    }

    // Encrypt API key before storing
    const encryptedApiKey = encryptApiKey(body.apiKey);

    // Check if this is the first model (make it default)
    const isFirstModel = modelCount === 0;

    const model = await prisma.userModel.create({
      data: {
        userId: user.id,
        name: body.name,
        modelId: body.modelId,
        baseURL: body.baseURL,
        apiKey: encryptedApiKey,
        description: body.description || null,
        logoUrl: body.logoUrl || null,
        systemPrompt: body.systemPrompt || null,
        isDefault: isFirstModel,
        supportsVision: body.supportsVision ?? false,
      },
    });

    return NextResponse.json(
      {
        ...model,
        apiKey: maskApiKey(body.apiKey), // Return masked key
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create model:", error);
    return NextResponse.json(
      { error: "Failed to create model" },
      { status: 500 },
    );
  }
}
