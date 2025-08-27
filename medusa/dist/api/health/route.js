export async function GET(req, res) {
    res.json({
        ok: true,
        service: 'monepiceriz-medusa',
        medusa: 'v2',
        timestamp: new Date().toISOString()
    });
}
