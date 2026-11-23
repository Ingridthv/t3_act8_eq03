package mx.edu.controlalumnos.admin;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import mx.edu.controlalumnos.dto.PageResponse;
import org.springframework.jdbc.core.JdbcTemplate;

/** Arma el WHERE de una consulta con parámetros y devuelve una página de resultados (todo en la base de datos). */
public final class ConsultaSql {

    private final StringBuilder where = new StringBuilder(" WHERE 1 = 1");
    private final List<Object> args = new ArrayList<>();

    /** Agrega una condición con sus parámetros (siempre con ?, nunca texto del usuario dentro del SQL). */
    public ConsultaSql y(String condicion, Object... valores) {
        where.append(" AND ").append(condicion);
        args.addAll(List.of(valores));
        return this;
    }

    /** Búsqueda por texto en varias expresiones (ILIKE con % y _ escapados). */
    public ConsultaSql buscar(String q, String... expresiones) {
        if (q == null || q.isBlank()) {
            return this;
        }
        String like = patron(q);
        List<String> partes = new ArrayList<>();
        for (String e : expresiones) {
            partes.add(e + " ILIKE ?");
            args.add(like);
        }
        where.append(" AND (").append(String.join(" OR ", partes)).append(")");
        return this;
    }

    public static String patron(String q) {
        String limpio = q.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + limpio + "%";
    }

    public static int tamanio(int size) {
        return size < 1 ? 10 : Math.min(size, 50);
    }

    public PageResponse<Map<String, Object>> pagina(JdbcTemplate jdbc, String select, String from,
                                                    String orden, int page, int size) {
        int tam = tamanio(size);
        int pag = Math.max(0, page);

        Long total = jdbc.queryForObject("SELECT COUNT(*) " + from + where, Long.class, args.toArray());
        long t = total == null ? 0 : total;

        List<Object> conPagina = new ArrayList<>(args);
        conPagina.add(tam);
        conPagina.add((long) pag * tam);

        List<Map<String, Object>> items = jdbc.queryForList(
                select + " " + from + where + " ORDER BY " + orden + " LIMIT ? OFFSET ?", conPagina.toArray());

        int paginas = (int) Math.max(1, (t + tam - 1) / tam);
        return new PageResponse<>(items, pag, tam, t, paginas);
    }
}
