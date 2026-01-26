import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

model = tf.keras.models.load_model("../app/models/model_v1.h5")

datagen = ImageDataGenerator(rescale=1.0 / 255)

test = datagen.flow_from_directory(
    "dataset", target_size=(224, 224), batch_size=32, class_mode="categorical"
)

loss, acc = model.evaluate(test)
print(f"Accuracy: {acc * 100:.2f}%")
