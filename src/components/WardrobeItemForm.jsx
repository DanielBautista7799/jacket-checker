import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Images,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Shirt,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  WARDROBE_CATEGORIES,
  WARDROBE_COLORS,
  WARDROBE_FITS,
  WARDROBE_MATERIALS,
  WARDROBE_STYLE_TAGS,
  WARDROBE_WEATHER_USES,
  formatWardrobeLabel,
  getSubtypesForCategory,
} from "../data/wardrobeOptions";
import useWardrobeImageAnalysis from "../hooks/useWardrobeImageAnalysis";
import useWardrobeImages from "../hooks/useWardrobeImages";
import { getWardrobeConfidenceLabel } from "../utils/normalizeWardrobeAnalysis";
import {
  validateWardrobeImage,
  validateWardrobeImages,
} from "../utils/wardrobeImageStorage";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10";

function createInitialForm() {
  return {
    name: "",
    category: "jacket",
    subtype: "windbreaker",
    primary_color: "black",
    secondary_color: "",
    materials: [],
    warmth_rating: 2,
    rain_rating: 2,
    wind_rating: 2,
    formality_rating: 1,
    fit: "regular",
    style_tags: [],
    weather_use: [],
    description: "",
  };
}

function buildFormFromItem(item) {
  if (!item) {
    return createInitialForm();
  }

  return {
    name: item.name || "",
    category: item.category || "jacket",
    subtype: item.subtype || item.type || "other",
    primary_color: item.primary_color || item.color || "other",
    secondary_color: item.secondary_color || "",
    materials: Array.isArray(item.materials) ? item.materials : [],
    warmth_rating: Number(item.warmth_rating) || 1,
    rain_rating: Number(item.rain_rating) || 1,
    wind_rating: Number(item.wind_rating) || 1,
    formality_rating: Number(item.formality_rating) || 1,
    fit: item.fit || "regular",
    style_tags: Array.isArray(item.style_tags) ? item.style_tags : [],
    weather_use: Array.isArray(item.weather_use) ? item.weather_use : [],
    description: item.description || "",
  };
}

function buildFormFromAnalysis(result) {
  return {
    name: result.name,
    category: result.category,
    subtype: result.subtype,
    primary_color: result.primaryColor,
    secondary_color: result.secondaryColor || "",
    materials: result.materials,
    warmth_rating: result.warmthRating,
    rain_rating: result.rainRating,
    wind_rating: result.windRating,
    formality_rating: result.formalityRating,
    fit: result.fit,
    style_tags: result.styleTags,
    weather_use: result.weatherUse,
    description: result.description,
  };
}

function createPendingImage(file) {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    signature: `${file.name}:${file.size}:${file.lastModified}`,
  };
}

function getSavedImageUrl(image) {
  return image?.processed_image_url || image?.image_url || "";
}

function orderPendingForUpload(images, pendingPrimaryId) {
  if (!pendingPrimaryId) {
    return images;
  }

  const primaryImage = images.find((image) => image.id === pendingPrimaryId);

  if (!primaryImage) {
    return images;
  }

  return [
    primaryImage,
    ...images.filter((image) => image.id !== pendingPrimaryId),
  ];
}

async function savedImageToFile(image, itemName) {
  const imageUrl = getSavedImageUrl(image);

  if (!imageUrl) {
    throw new Error("The selected primary image is not available.");
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Could not read the saved primary image for analysis.");
  }

  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";

  return new File([blob], `${itemName || "wardrobe-item"}.${extension}`, {
    type: mimeType,
  });
}

function RatingField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-200">
        {label}: {value}/5
      </label>

      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </div>
  );
}

function ToggleGroup({ label, options, selectedValues, onToggle }) {
  return (
    <div className="md:col-span-2">
      <p className="mb-3 text-sm font-semibold text-slate-200">{label}</p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selectedValues.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                active
                  ? "bg-sky-500 text-white"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              {formatWardrobeLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageActionButton({
  label,
  onClick,
  disabled,
  children,
  danger = false,
  active = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-xl p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "bg-red-500/15 text-red-200 hover:bg-red-500/25"
          : active
            ? "bg-amber-400 text-slate-950"
            : "bg-slate-950/80 text-slate-200 hover:bg-sky-500/30"
      }`}
    >
      {children}
    </button>
  );
}

function WardrobeItemFormInner({
  onSave,
  loading = false,
  editingItem = null,
  onCancelEdit,
  onSaveComplete,
}) {
  const [form, setForm] = useState(() => buildFormFromItem(editingItem));
  const [pendingImages, setPendingImages] = useState([]);
  const [pendingPrimaryId, setPendingPrimaryId] = useState(null);
  const [imageError, setImageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState(null);

  const {
    analysis,
    analysisStatus,
    analysisError,
    analyzeImage,
    resetAnalysis,
  } = useWardrobeImageAnalysis();

  const {
    maxWardrobeImagesPerItem,
    wardrobeImageLoading,
    wardrobeImageError,
    clearWardrobeImageError,
    addWardrobeImages,
    setPrimaryWardrobeImage,
    reorderWardrobeImages,
    replaceWardrobeImage,
    deleteWardrobeImage,
  } = useWardrobeImages();

  const addImagesInputRef = useRef(null);
  const replaceImageInputRef = useRef(null);
  const pendingImagesRef = useRef([]);

  const isEditing = Boolean(editingItem);
  const isAnalyzing = analysisStatus === "analyzing";
  const hasAppliedAnalysis = analysisStatus === "success" && Boolean(analysis);
  const imageBusy = wardrobeImageLoading || isSubmitting || loading;

  const savedImages = Array.isArray(editingItem?.images)
    ? editingItem.images
    : [];

  const savedPrimaryImage =
    editingItem?.primary_image ||
    savedImages.find((image) => image.is_primary) ||
    savedImages[0] ||
    null;

  const selectedPendingPrimary = useMemo(
    () => pendingImages.find((image) => image.id === pendingPrimaryId) || null,
    [pendingImages, pendingPrimaryId]
  );

  const totalImageCount = savedImages.length + pendingImages.length;
  const remainingImageSlots = Math.max(
    0,
    maxWardrobeImagesPerItem - totalImageCount
  );

  const subtypeOptions = useMemo(() => {
    const options = getSubtypesForCategory(form.category);

    if (form.subtype && !options.includes(form.subtype)) {
      return [form.subtype, ...options];
    }

    return options;
  }, [form.category, form.subtype]);

  const colorOptions = useMemo(() => {
    const currentColors = [form.primary_color, form.secondary_color].filter(
      Boolean
    );

    const missingColors = currentColors.filter(
      (color) => !WARDROBE_COLORS.includes(color)
    );

    return [...new Set([...missingColors, ...WARDROBE_COLORS])];
  }, [form.primary_color, form.secondary_color]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleArrayValue = (field, value) => {
    setForm((current) => {
      const currentValues = Array.isArray(current[field])
        ? current[field]
        : [];

      return {
        ...current,
        [field]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  };

  const handleCategoryChange = (category) => {
    setForm((current) => ({
      ...current,
      category,
      subtype: getSubtypesForCategory(category)[0],
    }));
  };

  const clearPendingImages = () => {
    pendingImagesRef.current.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });

    pendingImagesRef.current = [];
    setPendingImages([]);
    setPendingPrimaryId(null);

    if (addImagesInputRef.current) {
      addImagesInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    clearPendingImages();
    clearWardrobeImageError();
    resetAnalysis();
    setForm(createInitialForm());
    setImageError("");
    setReplaceTargetId(null);

    if (replaceImageInputRef.current) {
      replaceImageInputRef.current.value = "";
    }
  };

  const handleAddImages = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    clearWardrobeImageError();
    setImageError("");

    const existingSignatures = new Set(
      pendingImages.map((image) => image.signature)
    );

    const uniqueFiles = selectedFiles.filter((file) => {
      const signature = `${file.name}:${file.size}:${file.lastModified}`;

      if (existingSignatures.has(signature)) {
        return false;
      }

      existingSignatures.add(signature);
      return true;
    });

    if (uniqueFiles.length === 0) {
      setImageError("Those images are already selected.");
      return;
    }

    const validation = validateWardrobeImages(uniqueFiles, {
      currentCount: totalImageCount,
      maxImages: maxWardrobeImagesPerItem,
    });

    if (!validation.valid) {
      setImageError(validation.error);
      return;
    }

    const nextImages = validation.files.map(createPendingImage);

    setPendingImages((current) => [...current, ...nextImages]);

    if (!savedPrimaryImage && !pendingPrimaryId) {
      setPendingPrimaryId(nextImages[0].id);
    }

    resetAnalysis();
  };

  const removePendingImage = (imageId) => {
    setPendingImages((current) => {
      const target = current.find((image) => image.id === imageId);
      const remaining = current.filter((image) => image.id !== imageId);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      if (pendingPrimaryId === imageId) {
        setPendingPrimaryId(
          !savedPrimaryImage && remaining.length > 0 ? remaining[0].id : null
        );
      }

      return remaining;
    });

    resetAnalysis();
  };

  const movePendingImage = (imageId, direction) => {
    setPendingImages((current) => {
      const index = current.findIndex((image) => image.id === imageId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  };

  const choosePendingPrimary = (imageId) => {
    setPendingPrimaryId(imageId);
    resetAnalysis();
  };

  const chooseSavedPrimary = async (imageId) => {
    clearWardrobeImageError();
    setImageError("");
    setPendingPrimaryId(null);
    resetAnalysis();

    const result = await setPrimaryWardrobeImage(editingItem.id, imageId);

    if (!result) {
      setImageError("Could not set that image as primary.");
    }
  };

  const moveSavedImage = async (imageId, direction) => {
    const index = savedImages.findIndex((image) => image.id === imageId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= savedImages.length) {
      return;
    }

    const orderedIds = savedImages.map((image) => image.id);
    const [movedId] = orderedIds.splice(index, 1);
    orderedIds.splice(nextIndex, 0, movedId);

    clearWardrobeImageError();
    setImageError("");

    const result = await reorderWardrobeImages(editingItem.id, orderedIds);

    if (!result) {
      setImageError("Could not update the saved image order.");
    }
  };

  const requestReplaceSavedImage = (imageId) => {
    setReplaceTargetId(imageId);
    setImageError("");
    clearWardrobeImageError();

    if (replaceImageInputRef.current) {
      replaceImageInputRef.current.value = "";
      replaceImageInputRef.current.click();
    }
  };

  const handleReplaceSavedImage = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";

    if (!file || !replaceTargetId || !editingItem?.id) {
      setReplaceTargetId(null);
      return;
    }

    const validation = validateWardrobeImage(file);

    if (!validation.valid) {
      setImageError(validation.error);
      setReplaceTargetId(null);
      return;
    }

    clearWardrobeImageError();
    setImageError("");
    resetAnalysis();

    const result = await replaceWardrobeImage(
      editingItem.id,
      replaceTargetId,
      file
    );

    if (!result) {
      setImageError("Could not replace that saved image.");
    }

    setReplaceTargetId(null);
  };

  const handleDeleteSavedImage = async (image) => {
    const confirmed = window.confirm(
      `Delete image ${Number(image.display_order) + 1} from "${editingItem.name}"?`
    );

    if (!confirmed) {
      return;
    }

    clearWardrobeImageError();
    setImageError("");
    resetAnalysis();

    const result = await deleteWardrobeImage(editingItem.id, image.id);

    if (!result) {
      setImageError("Could not delete that saved image.");
    }
  };

  const handleAnalyze = async () => {
    setImageError("");

    let sourceFile = selectedPendingPrimary?.file || null;

    if (!sourceFile && !pendingPrimaryId && savedPrimaryImage) {
      try {
        sourceFile = await savedImageToFile(savedPrimaryImage, form.name);
      } catch (error) {
        setImageError(
          error.message || "Could not prepare the primary image for analysis."
        );
        return;
      }
    }

    if (!sourceFile && pendingImages.length > 0) {
      sourceFile = pendingImages[0].file;
    }

    if (!sourceFile) {
      setImageError("Add an image or choose a primary image before analysis.");
      return;
    }

    const result = await analyzeImage(sourceFile, form.category);

    if (!result) {
      return;
    }

    setForm(buildFormFromAnalysis(result));
  };

  const handleDiscardAnalysis = () => {
    resetAnalysis();
  };

  const handleCancel = () => {
    resetForm();
    onCancelEdit?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || isAnalyzing || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    clearWardrobeImageError();
    setImageError("");

    const payload = {
      name: form.name.trim(),
      category: form.category,
      subtype: form.subtype,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color || null,
      materials: form.materials,
      warmth_rating: Number(form.warmth_rating),
      rain_rating: Number(form.rain_rating),
      wind_rating: Number(form.wind_rating),
      formality_rating: Number(form.formality_rating),
      fit: form.fit,
      style_tags: form.style_tags,
      weather_use: form.weather_use,
      description: form.description.trim() || null,
      confirmed_by_user: true,
    };

    if (hasAppliedAnalysis) {
      payload.ai_generated = true;
      payload.ai_provider = analysis.provider;
      payload.ai_model = analysis.model;
      payload.ai_confidence = analysis.confidence;
      payload.original_ai_json = analysis.originalAiJson;
    } else if (!isEditing) {
      payload.ai_generated = false;
      payload.ai_provider = null;
      payload.ai_model = null;
      payload.ai_confidence = null;
      payload.original_ai_json = null;
    }

    const orderedPending = orderPendingForUpload(
      pendingImages,
      pendingPrimaryId
    );

    try {
      if (!isEditing) {
        const primaryFile = orderedPending[0]?.file || null;
        const savedItem = await onSave(payload, primaryFile);

        if (!savedItem) {
          return;
        }

        const additionalFiles = orderedPending.slice(1).map((image) => image.file);

        if (additionalFiles.length > 0) {
          const updatedItem = await addWardrobeImages(
            savedItem.id,
            additionalFiles
          );

          if (!updatedItem) {
            clearPendingImages();
            setImageError(
              "The item was saved, but one or more extra images did not upload. Open the item again to retry those images."
            );
            onSaveComplete?.(savedItem, { imageWarning: true });
            return;
          }
        }

        resetForm();
        onSaveComplete?.(savedItem, { imageWarning: false });
        return;
      }

      const existingImageIds = new Set(savedImages.map((image) => image.id));
      const updatedItem = await onSave(payload, null);

      if (!updatedItem) {
        return;
      }

      let itemAfterImages = updatedItem;

      if (orderedPending.length > 0) {
        itemAfterImages = await addWardrobeImages(
          editingItem.id,
          orderedPending.map((image) => image.file)
        );

        if (!itemAfterImages) {
          setImageError(
            "Your item details were saved, but the new images did not upload. The selected images are still here so you can try saving again."
          );
          return;
        }

        const addedImages = itemAfterImages.images
          .filter((image) => !existingImageIds.has(image.id))
          .sort(
            (first, second) =>
              Number(first.display_order) - Number(second.display_order)
          );

        const pendingPrimaryIndex = orderedPending.findIndex(
          (image) => image.id === pendingPrimaryId
        );

        clearPendingImages();

        if (pendingPrimaryIndex >= 0 && addedImages[pendingPrimaryIndex]) {
          const primaryResult = await setPrimaryWardrobeImage(
            editingItem.id,
            addedImages[pendingPrimaryIndex].id
          );

          if (!primaryResult) {
            setImageError(
              "The new images were uploaded, but the selected primary image could not be applied. Choose the primary image from the saved-image controls."
            );
            return;
          }

          itemAfterImages = primaryResult;
        }
      }

      resetForm();
      onSaveComplete?.(itemAfterImages, { imageWarning: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAnalyze =
    Boolean(selectedPendingPrimary?.file) ||
    (!pendingPrimaryId && Boolean(savedPrimaryImage)) ||
    pendingImages.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="h-fit rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-300">
          <Shirt size={22} />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {isEditing ? "Edit Item" : "Add Item"}
          </p>

          <h2 className="text-2xl font-black text-white">
            {isEditing ? editingItem.name : "Build your wardrobe"}
          </h2>
        </div>
      </div>

      <input
        ref={addImagesInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleAddImages}
        className="hidden"
      />

      <input
        ref={replaceImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleReplaceSavedImage}
        className="hidden"
      />

      <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.025] p-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-white">
              <Images size={19} className="text-sky-300" />
              <h3 className="font-black">Item images</h3>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              {totalImageCount}/{maxWardrobeImagesPerItem} images · the primary
              image appears across recommendations and wardrobe cards.
            </p>
          </div>

          <button
            type="button"
            onClick={() => addImagesInputRef.current?.click()}
            disabled={imageBusy || remainingImageSlots === 0}
            className="flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus size={17} />
            {remainingImageSlots === 0 ? "Image limit reached" : "Add images"}
          </button>
        </div>

        {savedImages.length === 0 && pendingImages.length === 0 ? (
          <button
            type="button"
            onClick={() => addImagesInputRef.current?.click()}
            disabled={imageBusy}
            className="flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center transition hover:border-sky-500/50 hover:bg-sky-500/5 disabled:opacity-50"
          >
            <ImagePlus size={30} className="text-sky-300" />
            <span className="mt-3 font-bold text-white">
              Add up to {maxWardrobeImagesPerItem} item photos
            </span>
            <span className="mt-1 text-sm text-slate-400">
              JPG, PNG, or WebP · 5 MB maximum per image
            </span>
          </button>
        ) : (
          <div className="space-y-5">
            {savedImages.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Saved images
                  </p>
                  <p className="text-xs text-slate-500">
                    Changes here save immediately
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {savedImages.map((image, index) => {
                    const imageUrl = getSavedImageUrl(image);
                    const isPrimary = Boolean(image.is_primary);

                    return (
                      <div
                        key={image.id}
                        className={`overflow-hidden rounded-2xl border bg-slate-900 ${
                          isPrimary
                            ? "border-amber-300/70 ring-2 ring-amber-300/20"
                            : "border-white/10"
                        }`}
                      >
                        <div className="relative aspect-square bg-white/[0.03]">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`${editingItem.name} image ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-600">
                              <Images size={28} />
                            </div>
                          )}

                          {isPrimary && (
                            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-slate-950">
                              <Star size={11} fill="currentColor" />
                              Primary
                            </span>
                          )}

                          <span className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-white">
                            {index + 1}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-1 p-2">
                          <ImageActionButton
                            label="Set as primary image"
                            onClick={() => chooseSavedPrimary(image.id)}
                            disabled={imageBusy || isPrimary}
                            active={isPrimary}
                          >
                            <Star size={15} fill={isPrimary ? "currentColor" : "none"} />
                          </ImageActionButton>

                          <ImageActionButton
                            label="Move image left"
                            onClick={() => moveSavedImage(image.id, -1)}
                            disabled={imageBusy || index === 0}
                          >
                            <ArrowLeft size={15} />
                          </ImageActionButton>

                          <ImageActionButton
                            label="Move image right"
                            onClick={() => moveSavedImage(image.id, 1)}
                            disabled={imageBusy || index === savedImages.length - 1}
                          >
                            <ArrowRight size={15} />
                          </ImageActionButton>

                          <ImageActionButton
                            label="Replace saved image"
                            onClick={() => requestReplaceSavedImage(image.id)}
                            disabled={imageBusy}
                          >
                            <RefreshCw size={15} />
                          </ImageActionButton>

                          <ImageActionButton
                            label="Delete saved image"
                            onClick={() => handleDeleteSavedImage(image)}
                            disabled={imageBusy}
                            danger
                          >
                            <Trash2 size={15} />
                          </ImageActionButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pendingImages.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-300">
                    New images ready to upload
                  </p>
                  <p className="text-xs text-slate-500">
                    Save the item to upload them
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {pendingImages.map((image, index) => {
                    const isPendingPrimary = pendingPrimaryId === image.id;

                    return (
                      <div
                        key={image.id}
                        className={`overflow-hidden rounded-2xl border bg-slate-900 ${
                          isPendingPrimary
                            ? "border-amber-300/70 ring-2 ring-amber-300/20"
                            : "border-sky-400/20"
                        }`}
                      >
                        <div className="relative aspect-square">
                          <img
                            src={image.previewUrl}
                            alt={`New wardrobe image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />

                          {isPendingPrimary && (
                            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-slate-950">
                              <Star size={11} fill="currentColor" />
                              Future primary
                            </span>
                          )}

                          <span className="absolute right-2 top-2 rounded-full bg-sky-500 px-2 py-1 text-[10px] font-black text-white">
                            New
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1 p-2">
                          <ImageActionButton
                            label="Use as primary image"
                            onClick={() => choosePendingPrimary(image.id)}
                            disabled={imageBusy || isPendingPrimary}
                            active={isPendingPrimary}
                          >
                            <Star
                              size={15}
                              fill={isPendingPrimary ? "currentColor" : "none"}
                            />
                          </ImageActionButton>

                          <ImageActionButton
                            label="Move selected image left"
                            onClick={() => movePendingImage(image.id, -1)}
                            disabled={imageBusy || index === 0}
                          >
                            <ArrowLeft size={15} />
                          </ImageActionButton>

                          <ImageActionButton
                            label="Move selected image right"
                            onClick={() => movePendingImage(image.id, 1)}
                            disabled={imageBusy || index === pendingImages.length - 1}
                          >
                            <ArrowRight size={15} />
                          </ImageActionButton>

                          <ImageActionButton
                            label="Remove selected image"
                            onClick={() => removePendingImage(image.id)}
                            disabled={imageBusy}
                            danger
                          >
                            <X size={15} />
                          </ImageActionButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => addImagesInputRef.current?.click()}
            disabled={imageBusy || remainingImageSlots === 0}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add more images ({remainingImageSlots} slots left)
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={imageBusy || isAnalyzing || !canAnalyze}
            className="flex items-center justify-center gap-2 rounded-2xl bg-purple-500 px-4 py-3 text-sm font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzing ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}

            {isAnalyzing
              ? "Analyzing primary image..."
              : hasAppliedAnalysis
                ? "Analyze primary image again"
                : "Analyze primary image with AI"}
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          AI uses the image marked primary. Without a photo, every field can
          still be completed manually.
        </p>
      </section>

      {(imageError || wardrobeImageError) && (
        <div className="mb-5 flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{imageError || wardrobeImageError}</span>
        </div>
      )}

      {analysisError && (
        <div className="mb-5 flex gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Automatic analysis did not finish.</p>
            <p className="mt-1">{analysisError}</p>
            <p className="mt-1 text-amber-200/80">
              Your images remain selected, and manual entry is still available.
            </p>
          </div>
        </div>
      )}

      {hasAppliedAnalysis && (
        <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-bold">AI suggestions are ready for review.</p>
                <p className="mt-1 text-emerald-200/80">
                  Every field below remains editable. Saving confirms your final
                  corrections.
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  {getWardrobeConfidenceLabel(analysis.confidence.overall)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDiscardAnalysis}
              className="shrink-0 rounded-xl border border-emerald-300/20 px-3 py-2 text-xs font-bold transition hover:bg-emerald-300/10"
            >
              Treat as manual
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Item name
          </label>

          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Black windbreaker"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Category
          </label>

          <select
            value={form.category}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className={inputClass}
          >
            {WARDROBE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Type
          </label>

          <select
            value={form.subtype}
            onChange={(event) => updateField("subtype", event.target.value)}
            className={inputClass}
          >
            {subtypeOptions.map((subtype) => (
              <option key={subtype} value={subtype}>
                {formatWardrobeLabel(subtype)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Primary color
          </label>

          <select
            value={form.primary_color}
            onChange={(event) =>
              updateField("primary_color", event.target.value)
            }
            className={inputClass}
          >
            {colorOptions.map((color) => (
              <option key={color} value={color}>
                {formatWardrobeLabel(color)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Secondary color
          </label>

          <select
            value={form.secondary_color}
            onChange={(event) =>
              updateField("secondary_color", event.target.value)
            }
            className={inputClass}
          >
            <option value="">None</option>

            {colorOptions.map((color) => (
              <option key={color} value={color}>
                {formatWardrobeLabel(color)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Fit
          </label>

          <select
            value={form.fit}
            onChange={(event) => updateField("fit", event.target.value)}
            className={inputClass}
          >
            {WARDROBE_FITS.map((fit) => (
              <option key={fit.value} value={fit.value}>
                {fit.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Description
          </label>

          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short notes about the item, details, or when you wear it"
            rows="3"
            maxLength="240"
            className={inputClass}
          />
        </div>

        <RatingField
          label="Warmth"
          value={form.warmth_rating}
          onChange={(value) => updateField("warmth_rating", value)}
        />

        <RatingField
          label="Rain protection"
          value={form.rain_rating}
          onChange={(value) => updateField("rain_rating", value)}
        />

        <RatingField
          label="Wind protection"
          value={form.wind_rating}
          onChange={(value) => updateField("wind_rating", value)}
        />

        <RatingField
          label="Formality"
          value={form.formality_rating}
          onChange={(value) => updateField("formality_rating", value)}
        />

        <ToggleGroup
          label="Materials"
          options={WARDROBE_MATERIALS}
          selectedValues={form.materials}
          onToggle={(value) => toggleArrayValue("materials", value)}
        />

        <ToggleGroup
          label="Style tags"
          options={WARDROBE_STYLE_TAGS}
          selectedValues={form.style_tags}
          onToggle={(value) => toggleArrayValue("style_tags", value)}
        />

        <ToggleGroup
          label="Best weather use"
          options={WARDROBE_WEATHER_USES}
          selectedValues={form.weather_use}
          onToggle={(value) => toggleArrayValue("weather_use", value)}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={
            loading ||
            wardrobeImageLoading ||
            isSubmitting ||
            isAnalyzing ||
            !form.name.trim()
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 font-black text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading || wardrobeImageLoading || isSubmitting ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}

          {loading || wardrobeImageLoading || isSubmitting
            ? "Saving..."
            : isEditing
              ? "Save item and new images"
              : "Save wardrobe item"}
        </button>

        {isEditing ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={imageBusy || isAnalyzing}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <X size={18} />
            Cancel edit
          </button>
        ) : (
          <button
            type="button"
            onClick={resetForm}
            disabled={imageBusy || isAnalyzing}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        )}
      </div>
    </form>
  );
}

function WardrobeItemForm(props) {
  const formKey = props.editingItem?.id || "new-wardrobe-item";

  return <WardrobeItemFormInner key={formKey} {...props} />;
}

export default WardrobeItemForm;
