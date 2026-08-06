export default function handler(req, res) {
  res.status(200).json({
    id: "wiaponto",
    name: "Wiaponto",
    settings: {},
    status: "active"
  });
}
