package mx.edu.controlalumnos.dto;

import java.util.List;
import org.springframework.data.domain.Page;

// envoltorio de una pagina de resultados. usa los mismos nombres que espera EntityPage (items, page, totalPages, total)
public record PageResponse<T>(List<T> items, int page, int size, long total, int totalPages) {

    public static <T> PageResponse<T> of(Page<T> p) {
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(),
                p.getTotalElements(), p.getTotalPages());
    }
}