import { RecipeForm } from "@/components/admin/recipe-form";
import { createRecipe } from "@/app/admin/(dashboard)/recipes/actions";

export default function NewRecipePage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add recipe</h1>
      <p className="mt-1 text-ink-soft">Write it up once, publish it to the storefront whenever it&apos;s ready.</p>
      <div className="mt-8">
        <RecipeForm action={createRecipe} />
      </div>
    </div>
  );
}
