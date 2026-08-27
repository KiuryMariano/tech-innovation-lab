from ultralytics import YOLO
from xml.parsers.expat import model

model = YOLO("yolov8n.pt")

results = model("images.jpeg")
for result in results:
    result.show()
    result.save("output.jpeg")