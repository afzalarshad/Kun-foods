import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecipeForm } from "@/components/admin/recipe-form";
import { updateRecipe } from "@/app/admin/(dashboard)/recipes/actions";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) notFound();

  const updateWithId = updateRecipe.bind(null, recipe.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit recipe</h1>
      <p className="mt-1 text-ink-soft">{recipe.title}</p>
      <div className="mt-8">
        <RecipeForm action={updateWithId} recipe={recipe} />
      </div>
    </div>
  );
}
