'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react';
import { marketplaceService, CreateProductData } from '@/services/marketplace';
import { useToast } from '@/hooks/use-toast';

type Category = {
  id: number;
  name: string;
};

const UNITS = ['kg', 'g', 'L', 'pièce', 'sac', 'carton'];

const QUALITY_GRADES = [
  { value: 'premium', label: 'Premium' },
  { value: 'standard', label: 'Standard' },
  { value: 'economy', label: 'Économique' },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const productId = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    category_name: '',
    price_per_unit: 0,
    available_quantity: 1,
    unit: 'kg',
    harvest_date: '',
    farm_location: '',
    organic: false,
    quality_grade: 'standard',
  });

  // =========================
  // Load product + categories
  // =========================
  useEffect(() => {
    const loadData = async () => {
      try {
        const [product, cats] = await Promise.all([
          marketplaceService.getProduct(productId),
          marketplaceService.getCategories(),
        ]);

        setFormData({
          name: product.name,
          description: product.description,
          category_name: String(product.category),
          price_per_unit: Number(product.price_per_unit),
          available_quantity: product.available_quantity,
          unit: product.unit,
          harvest_date: product.harvest_date,
          farm_location: product.farm_location,
          organic: product.organic,
          quality_grade: product.quality_grade,
        });

        setExistingImages(product.images || []);

        setCategories(Array.isArray(cats?.results) ? cats.results : cats || []);
      } catch (err) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le produit',
          variant: 'destructive',
        });
        router.push('/dashboard/farmer');
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [productId]);

  // =========================
  // Handlers
  // =========================
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'price_per_unit' || name === 'available_quantity'
          ? Number(value)
          : value,
    }));
  };

  const handleSelectChange = (name: keyof CreateProductData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, organic: checked }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files.slice(0, 5));
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeNewImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  // =========================
  // Submit
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await marketplaceService.updateProduct(productId, {
        ...formData,
        images: images.length > 0 ? images : undefined,
      });

      toast({
        title: 'Succès',
        description: 'Produit mis à jour avec succès',
        variant: 'success',
      });

      router.push('/dashboard/farmer');
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce produit ?')) return;
    await marketplaceService.deleteProduct(productId);
    router.push('/dashboard/farmer');
  };

  if (fetching) {
    return <div className="container py-8 text-center">Chargement...</div>;
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle>Modifier le produit</CardTitle>
              <CardDescription>Mettez à jour votre produit</CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Tomates bio"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre produit..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Catégorie *</Label>
                      <Select
                        value={formData.category_name}
                        onValueChange={(v) =>
                          handleSelectChange('category_name', v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="unit">Unité de vente *</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(value) =>
                          handleSelectChange('unit', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une unité" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price_per_unit">
                        Prix par unité (MRU) *
                      </Label>
                      <Input
                        id="price_per_unit"
                        name="price_per_unit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_per_unit}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="available_quantity">
                        Quantité disponible *
                      </Label>
                      <Input
                        id="available_quantity"
                        name="available_quantity"
                        type="number"
                        min="1"
                        step="0.1"
                        value={formData.available_quantity}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="harvest_date">Date de récolte *</Label>
                      <Input
                        id="harvest_date"
                        name="harvest_date"
                        type="date"
                        value={formData.harvest_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="quality_grade">Qualité</Label>
                      <Select
                        value={formData.quality_grade}
                        onValueChange={(value) =>
                          handleSelectChange('quality_grade', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la qualité" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALITY_GRADES.map((grade) => (
                            <SelectItem key={grade.value} value={grade.value}>
                              {grade.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="farm_location">
                      Localisation de la ferme *
                    </Label>
                    <Input
                      id="farm_location"
                      name="farm_location"
                      value={formData.farm_location}
                      onChange={handleInputChange}
                      placeholder="Ex: Nouakchott, Arafat"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Indiquez la ville/région où se trouve votre ferme
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="organic"
                      checked={formData.organic}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('organic', checked)
                      }
                    />
                    <Label htmlFor="organic">Produit biologique</Label>
                  </div>

                  <div>
                    <Label>Images du produit *</Label>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-4 mb-4">
                        {previews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                                Principale
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <Label
                        htmlFor="images"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
                      >
                        <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Cliquez pour télécharger des images
                        </span>
                        <Input
                          id="images"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={images.length >= 5}
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">
                        Téléchargez au moins 1 image. La première sera l'image
                        principale.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || images.length === 0}
                  >
                    {loading ? 'Création en cours...' : 'Créer le produit'}
                  </Button>
                </div>
              </form>
            </CardContent>

            <Button type="submit" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
