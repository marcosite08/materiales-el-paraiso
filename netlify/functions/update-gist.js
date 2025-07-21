exports.handler = async (event, context) => {
    // Solo permitir métodos POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Manejar preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        // Obtener el token desde las variables de entorno
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GIST_ID = '175dfae32c11cf82e3ebb92ffa5628da';

        if (!GITHUB_TOKEN) {
            throw new Error('GitHub token not configured');
        }

        // Parsear el cuerpo de la petición
        const requestBody = JSON.parse(event.body);
        const { brands, alerts, announcements } = requestBody;

        // Validar que tenemos datos
        if (!brands && !alerts && !announcements) {
            throw new Error('No data provided');
        }

        // Preparar la configuración para el Gist
        const config = {
            brands: brands || {},
            alerts: alerts || {},
            announcements: announcements || []
        };

        // Actualizar el Gist usando la GitHub API
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'MaterialesElParaiso/1.0'
            },
            body: JSON.stringify({
                files: {
                    'materiales-config.json': {
                        content: JSON.stringify(config, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('GitHub API Error:', response.status, errorData);
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const result = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Configuration updated successfully',
                gistUrl: result.html_url,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Function error:', error);

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
